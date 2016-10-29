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

        var map = {
            2: 'k',
            3: 'M',
            4: 'B',
        };
        // Otherwise, concat the comma-separated numbers, round and truncate
        // using `map`.
        var formatted = split[0] + '.' + split[1];
        formatted = parseFloat(formatted).toFixed(2) + map[split.length];

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
                    offset: offset
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
     */
    app.searchArtist = function(params, success) {
        params = _.defaults(params, {type: 'artist', limit: limit});
        $.get('https://api.spotify.com/v1/search',
            params,
            success
        ).fail(function(xhr, type, msg) {
            var template = Handlebars.templates['error.hbs'];
            var el = template({xhr: xhr, msg: msg});
            app.renderMessageBar(el);
        });
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
            var data = {
                image: !_.isEmpty(artist.images) && artist.images[0].url,
                name: artist.name,
                popularity: artist.popularity,
                popularityIcon: 'fa-ellipsis-h',
                followers: artist.followers.total.toLocaleString('en-US'),
                followersFormatted: truncateNumber(artist.followers.total),
                link: artist.external_urls.spotify,
            };

            if (artist.popularity >= 60) {
                data.popularityIcon = 'fa-chevron-up';
            } else if (artist.popularity < 40) {
                data.popularityIcon = 'fa-chevron-down';
            }

            template = Handlebars.templates['result.hbs'];
            el = template(data);
            content += el;
        });

        return content;
    };

    /**
     * Handler for triggering a new search. Does not issue a request if the
     * previous search term matches the current, or if the search bar is empty.
     *
     * @param {Object} [params] Query parameters to pass while issuing the
     *   request.
     */
    app.searchHandler = function(params) {
        var searchTerm = $('[data-searchbar]').val().trim();
        if (_.isEmpty(searchTerm) || query === searchTerm) {
            return;
        }

        query = searchTerm;
        params = _.defaults(params, {q: query});

        var loadingTpl = Handlebars.templates['loading.hbs']();
        app.renderMessageBar(loadingTpl);

        app.searchArtist(params, function(data) {
            var template;
            var el;

            // Unbind the pagination handler prior to appending results.
            app.unbindScrollHandler();

            // Starting a new search should reset the offset.
            offset = data.artists.offset;
            total = data.artists.total;

            if (_.isEmpty(data.artists.items)) {
                template = Handlebars.templates['no-results.hbs'];
                el = template(params.q);
                app.renderMessageBar(el);
                app.renderResults('');
                return;
            }

            var content = app.buildListTemplate(data);
            var messageTpl = Handlebars.templates['result-count.hbs']({
                count: data.artists.items.length,
                total: total,
                term: params.q
            });
            app.renderMessageBar(messageTpl);
            app.renderResults(content);

            if (total > data.artists.limit) {
                // Re-bind the pagination handler if we can paginate.
                app.bindScrollHandler();
            }
        });
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
            var count;

            if (remainder < data.artists.limit) {
                // We're at the last page.
                count = total;
                app.unbindScrollHandler();
            } else {
                // We have more pages.
                count = offset + data.artists.limit;
                app.bindScrollHandler();
            }

            var messageTpl = Handlebars.templates['result-count.hbs']({
                count: count,
                total: data.artists.total,
                term: query
            });

            app.renderMessageBar(messageTpl);
            app.appendResults(content);
        });
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
    });
})(app);
