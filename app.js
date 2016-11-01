var app = app || {};

(function(app) {
    /**
     * The current query string.
     *
     * @type {String}
     */
    var query = '';

    /**
     * The current offset value, used for pagination.
     *
     * @type {Number}
     */
    var offset = 0;

    /**
     * A number representing the total for the artist search results.
     *
     * @type {Number}
     */
    var total;

    /**
     * The number of items to return from calling the Spotify `/search` API.
     *
     * @type {Number}
     */
    var limit = 20;

    /**
     * Flag used to control whether or not to display popular artists when we
     * start the app. Useful for rate-limiting restrictions.
     *
     * @type {Boolean}
     */
    var showPopularArtistsOnStartup = true;

    /**
     * Displays a shorthand/truncated version of a large number, rounded to 2
     * decimal places.
     *
     * @param {Number} num An integer to be truncated.
     * @return {String} The formatted number, e.g. `1.08M`, `2.25k`, `250`.
     */
    var truncateNumber = function(num) {
        var split = num.toLocaleString('en-US').split(',');

        // If the number is small, just return the number.
        if (!split[1]) {
            return split[0];
        }

        // Otherwise, concat the comma-separated numbers, round and truncate
        // using `map`.
        var map = {
            1: 'k',
            2: 'M',
            3: 'B',
        };

        var formatted = split[0] + '.';

        split.shift();

        _.each(split, function(val) {
            formatted += val;
        });

        formatted = Number(Math.round(parseFloat(formatted) + 'e2') + 'e-2').toString() + map[split.length];

        return formatted;
    };

    /**
     * Binds the pagination scroll event on `document`. When the scroll bar is
     * near the bottom of the page, `app.paginate` is fired.
     */
    app.bindScrollHandler = function() {
        $(document).scroll(function() {
            var scrollPos = $(window).scrollTop();
            var nearBottom = $(document).height() - $(window).height() - 100;

            if (scrollPos >= nearBottom) {
                app.unbindScrollHandler();

                offset += limit;
                app.paginate({
                    q: query,
                    offset: offset,
                });
            }
        });
    };

    /**
     * Removes the pagination scroll event on `document`.
     */
    app.unbindScrollHandler = function() {
        $(document).off('scroll');
    };

    /**
     * Renders the message bar with the given `el`.
     *
     * @param {String} el The compiled string template.
     */
    app.renderMessageBar = function(el) {
        $('.message-bar').html(el);
    };

    /**
     * Renders the results list with the given `el`.
     *
     * @param {String} el The compiled string template.
     */
    app.renderResults = function(el) {
        $('.results').html(el);
    };

    /**
     * Appends the results list with the given `el`.
     *
     * @param {String} el The compiled string template.
     */
    app.appendResults = function(el) {
        $('.results').append(el);
    };

    /**
     * Performs a `GET` request on the Spotify artist search endpoint.
     *
     * @param {Object} [params] Query parameters to pass while issuing the
     *   request.
     * @param {Function} success Callback to be executed on success.
     * @param {Function} error Callback to be executed on error.
     * @return {jQuery.Deferred} The jQuery Deferred object.
     */
    app.searchArtist = function(params, success, error) {
        params = _.defaults(params, {type: 'artist', limit: limit});
        return $.get('https://api.spotify.com/v1/search',
            params,
            success
        ).fail(error);
    };

    /**
     * Callback to be executed on error when requesting the search endpoint.
     *
     * @param {jQuery.Deferred} xhr The error response object.
     * @param {String} type The type of error (e.g. 'error').
     * @param {String} msg The error message (e.g. 'Not Found').
     */
    app.searchArtistErrorCallback = function(xhr, type, msg) {
        var template = Handlebars.templates['error.hbs'];
        var el = template({xhr: xhr, msg: msg});
        app.renderMessageBar(el);
    };

    /**
     * Builds the template for the list items to be rendered in the list.
     *
     * @param {Object} data The data returned from the Spotify API.
     * @return {String} The template of list items.
     */
    app.buildListTemplate = function(data) {
        var content = '';

        _.each(data.artists.items, function(artist) {
            var templateData = {
                image: !_.isEmpty(artist.images) && artist.images[0].url,
                name: artist.name,
                popularity: artist.popularity,
                popularityIcon: 'fa-ellipsis-h',
                followersFormatted: truncateNumber(artist.followers.total),
                link: artist.external_urls.spotify,
            };

            var totalFollowers = artist.followers.total.toLocaleString('en-US');
            templateData.followersLabel = artist.followers.total === 1 ? totalFollowers + ' follower' : totalFollowers + ' followers';

            if (artist.popularity >= 60) {
                templateData.popularityIcon = 'fa-chevron-up';
            } else if (artist.popularity < 40) {
                templateData.popularityIcon = 'fa-chevron-down';
            }

            template = Handlebars.templates['result.hbs'];
            el = template(templateData);

            if (templateData.image) {
                // Unfortunately, some images are REALLY small, and
                // `backdrop-filter` has very limited support, so we need to
                // dynamically add the `background-image` and use
                // `background-size: cover` to achieve the blurred overlay.
                var $el = $(el);
                $el.find('.image-container, .blurred')
                    .css('background-image', 'url("' + templateData.image + '")');
                el = $el.get(0).outerHTML;
            }
            content += el;
        });

        return content;
    };

    /**
     * Handler for triggering a new search. Does not issue a request if the
     * previous search term matches the current, or if the search bar is empty.
     */
    app.searchHandler = function() {
        var searchTerm = $('[data-searchbar]').val().trim();
        if (_.isEmpty(searchTerm) || query === searchTerm) {
            return;
        }

        query = searchTerm;

        var loadingTpl = Handlebars.templates['loading.hbs']();
        app.renderMessageBar(loadingTpl);

        app.searchArtist({q: query}, function(data) {
            var template;
            var el;

            // Unbind the pagination handler prior to appending results.
            app.unbindScrollHandler();

            // Starting a new search should reset the offset.
            offset = data.artists.offset;
            total = data.artists.total;

            if (_.isEmpty(data.artists.items)) {
                template = Handlebars.templates['no-results.hbs'];
                el = template(query);
                app.renderMessageBar(el);
                app.renderResults('');
                return;
            }

            // Scroll to the top of the page, since we have a fixed navbar.
            if ($(window).scrollTop() > 0) {
                window.scrollTo(0, 0);
            }

            var content = app.buildListTemplate(data);
            app.renderResultsBar(data);
            app.renderResults(content);

            if (total > limit) {
                // Re-bind the pagination handler if we can paginate.
                app.bindScrollHandler();
            }
        }, app.searchArtistErrorCallback);
    };

    /**
     * Renders the message bar with an appropriate results template.
     *
     * @param {Object} data The data returned from the Spotify API.
     * @param {Object} [templateContext] Data to pass to the template being
     *   rendered.
     */
    app.renderResultsBar = function(data, templateContext) {
        if (total === 1) {
            // Don't render anything in the message bar for only 1 result, since
            // it looks silly.
            app.renderMessageBar('');
            return;
        }

        // For the case where we are increasing the `count` while paginating.
        templateContext = _.extend({
            count: data.artists.items.length,
            total: total,
            term: query,
        }, templateContext);

        // Template chosen depends if the `total` is less than the `limit`, or
        // if we've already paginated to the end.
        var allResults = total <= limit || templateContext.count === total;
        var countTemplate = allResults ? 'result-count-total.hbs' : 'result-count.hbs';
        var messageTpl = Handlebars.templates[countTemplate](templateContext);

        app.renderMessageBar(messageTpl);
    };

    /**
     * Issues a request to the Spotify `/search` endpoint, passing in the
     * `offset` to perform pagination.
     *
     * @param {Object} [params] Query parameters to pass while issuing the
     *   request.
     */
    app.paginate = function(params) {
        params = _.defaults(params, {offset: offset});

        app.searchArtist(params, function(data) {
            var content = app.buildListTemplate(data);
            var remainder = total - offset;
            var paginationCount;

            if (remainder < data.artists.limit) {
                // We're at the last page.
                paginationCount = total;
                app.unbindScrollHandler();
            } else {
                // We have more pages.
                paginationCount = offset + data.artists.limit;
                app.bindScrollHandler();
            }

            app.renderResultsBar(data, {count: paginationCount});
            app.appendResults(content);
        }, app.searchArtistErrorCallback);
    };

    /**
     * This method handles what to display when the app starts. In a nutshell,
     * it takes every letter of the English alphabet and calls the `/search`
     * endpoint against that letter (scary, I know). Using jQuery Deferreds, it
     * waits until each `GET` request is completed, and filters the results to
     * unique items, and artists that have a popularity score 70 or higher.
     *
     * Unfortunately, Spotify doesn't have an endpoint to fetch popular artists,
     * artists with lots of followers, or even some random artists - hence this
     * method.
     */
    app.start = function() {
        if (!showPopularArtistsOnStartup) {
            return;
        }

        var alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
        var ids = {};
        var deferreds = [];
        var loadingTpl = Handlebars.templates['loading.hbs']();

        app.renderMessageBar(loadingTpl);

        _.each(alphabet, function(letter) {
            deferreds.push(app.searchArtist({q: letter, limit: 50}));
        });

        $.when.apply($, deferreds)
            .done(function() {
                var args = Array.prototype.slice.call(arguments);
                // First argument in each of the args has the data.
                var responseList = _.map(args, _.first);
                var results = [];

                // Filter out artists with popularity < 70.
                _.each(responseList, function(data) {
                    _.each(data.artists.items, function(item) {
                        if (item.popularity >= 70 && !ids[item.id]) {
                            ids[item.id] = item;
                            results = results.concat([item]);
                        }
                    });
                });

                var hasResults = !_.isEmpty(results);
                var templateToLoad = hasResults ? 'popular-artists.hbs' : 'no-results.hbs';
                var template = Handlebars.templates[templateToLoad]();
                app.renderMessageBar(template);

                if (!hasResults) {
                    return;
                }

                var content = app.buildListTemplate({artists: {items: results}});
                app.renderResults(content);
            }).fail(app.searchArtistErrorCallback);
    };

    $(document).ready(function() {
        // Set up event listeners.
        $('[data-searchbutton]').click(app.searchHandler);
        $('[data-searchbar]').keypress(function(e) {
            // e.keyCode is deprecated, but Safari still doesn't support e.key.
            var isEnter = e.keyCode === 13;
            if (isEnter) {
                app.searchHandler();
            }
        });

        app.start();
    });
})(app);
