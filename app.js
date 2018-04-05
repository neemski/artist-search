(function() {
  /**
   * Obtains parameters from the hash of the URL.
   * @return {Object}
   */
  function getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
      q = window.location.hash.substring(1);
    while (e = r.exec(q)) {
      hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }

  function generateRandomString(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };

  var SpotifyAuth = function(initialState) {
    /**
     * The client ID of this Spotify application.
     *
     * @type {String}
     */
    this.clientId = '5fdeabe6e1eb4532ab32205e9b72b38f';

    /**
     * Response type. Either `code` or `token`.
     *
     * @type {String}
     */
    this.responseType = 'token';

    /**
     * The URI to redirect to after the user grants/denies permission.
     *
     * @type {String}
     */
    this.redirectUri = 'http://localhost:3000/';
    this.STATE_KEY = 'spotify-artist-search-app-state';
    this.accessToken = '';
    this.state = this.getState() || initialState;
  };

  SpotifyAuth.prototype.getState = function() {
    return this.state || localStorage.getItem(this.STATE_KEY);
  };

  SpotifyAuth.prototype.setState = function(newState) {
    localStorage.setItem(this.STATE_KEY, newState);
    this.state = newState;
  };

  SpotifyAuth.prototype.authorize = function() {
    var params = getHashParams();
    var access_token = params.access_token;
    var state = params.state;
    var storedState = this.getState();

    if (access_token && (state === storedState)) {
      this.accessToken = access_token;
      return;
    }

    this.setState(state || storedState);

    var params = {
      client_id: this.clientId,
      response_type: this.responseType,
      redirect_uri: this.redirectUri,
      state: this.state
    };
    var url = 'https://accounts.spotify.com/authorize?' + $.param(params);
    window.location = url;
  };

  var SpotifyApp = function(options) {

    this.accessToken = options.accessToken;

    /**
     * The current query string.
     *
     * @type {String}
     */
    this.query = '';

    /**
     * The current offset value, used for pagination.
     *
     * @type {Number}
     */
    this.offset = 0;

    /**
     * A number representing the total for the artist search results.
     *
     * @type {Number}
     */
    this.total = 0;

    /**
     * The number of items to return from calling the Spotify `/search` API.
     *
     * @type {Number}
     */
    this.limit = 20;

    /**
     * Flag used to control whether or not to display popular artists when we
     * start the app. Useful for rate-limiting restrictions.
     *
     * @type {Boolean}
     */
    this.showPopularArtistsOnStartup = true;
  };

  /**
   * Binds the pagination scroll event on `document`. When the scroll bar is
   * near the bottom of the page, `paginate` is fired.
   */
  SpotifyApp.prototype.bindScrollHandler = function() {
    var _self = this;

    $(document).scroll(function() {
      var scrollPos = $(window).scrollTop();
      var nearBottom = $(document).height() - $(window).height() - 100;

      if (scrollPos >= nearBottom) {
        _self.unbindScrollHandler();

        _self.offset += _self.limit;
        _self.paginate({
          q: _self.query,
          offset: _self.offset,
        });
      }
    });
  };

  /**
   * Removes the pagination scroll event on `document`.
   */
  SpotifyApp.prototype.unbindScrollHandler = function() {
    $(document).off('scroll');
  };

  /**
   * Renders the message bar with the given `el`.
   *
   * @param {String} el The compiled string template.
   */
  SpotifyApp.prototype.renderMessageBar = function(el) {
    $('.message-bar').html(el);
  };

  /**
   * Renders the results list with the given `el`.
   *
   * @param {String} el The compiled string template.
   */
  SpotifyApp.prototype.renderResults = function(el) {
    $('.results').html(el);
  };

  /**
   * Appends the results list with the given `el`.
   *
   * @param {String} el The compiled string template.
   */
  SpotifyApp.prototype.appendResults = function(el) {
    $('.results').append(el);
  };

  /**
   * Displays a shorthand/truncated version of a large number, rounded to 2
   * decimal places.
   *
   * @param {Number} num An integer to be truncated.
   * @return {String} The formatted number, e.g. `1.08M`, `2.25k`, `250`.
   */
  SpotifyApp.prototype.truncateNumber = function (num) {
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

    _.each(split, function (val) {
      formatted += val;
    });

    formatted = Number(Math.round(parseFloat(formatted) + 'e2') + 'e-2').toString() + map[split.length];

    return formatted;
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
  SpotifyApp.prototype.searchArtist = function(params, success, error) {
    params = _.defaults(params, { type: 'artist', limit: this.limit });
    return $.ajax({
      url: 'https://api.spotify.com/v1/search',
      headers: {
        'Authorization': 'Bearer ' + this.accessToken
      },
      data: params,
      success: success
    }).fail(error);
  };

  /**
   * Callback to be executed on error when requesting the search endpoint.
   *
   * @param {jQuery.Deferred} xhr The error response object.
   * @param {String} type The type of error (e.g. 'error').
   * @param {String} msg The error message (e.g. 'Not Found').
   */
  SpotifyApp.prototype.searchArtistErrorCallback = function(xhr, type, msg) {
    var template = Handlebars.templates['error.hbs'];
    var el = template({ xhr: xhr, msg: msg });
    this.renderMessageBar(el);
  };

  /**
   * Builds the template for the list items to be rendered in the list.
   *
   * @param {Object} data The data returned from the Spotify API.
   * @return {String} The template of list items.
   */
  SpotifyApp.prototype.buildListTemplate = function(data) {
    var _self = this;
    var content = '';

    _.each(data.artists.items, function(artist) {
      var templateData = {
        image: !_.isEmpty(artist.images) && artist.images[0].url,
        name: artist.name,
        popularity: artist.popularity,
        popularityIcon: 'fa-ellipsis-h',
        followersFormatted: _self.truncateNumber(artist.followers.total),
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
  SpotifyApp.prototype.searchHandler = function() {
    var searchTerm = $('[data-searchbar]').val().trim();
    if (_.isEmpty(searchTerm) || this.query === searchTerm) {
      return;
    }

    this.query = searchTerm;

    var loadingTpl = Handlebars.templates['loading.hbs']();
    this.renderMessageBar(loadingTpl);

    this.searchArtist(
      { q: this.query },
      _.bind(function(data) {
        var template;
        var el;

        // Unbind the pagination handler prior to appending results.
        this.unbindScrollHandler();

        // Starting a new search should reset the offset.
        this.offset = data.artists.offset;
        this.total = data.artists.total;

        if (_.isEmpty(data.artists.items)) {
          template = Handlebars.templates['no-results.hbs'];
          el = template(this.query);
          this.renderMessageBar(el);
          this.renderResults('');
          return;
        }

        // Scroll to the top of the page, since we have a fixed navbar.
        if ($(window).scrollTop() > 0) {
          window.scrollTo(0, 0);
        }

        var content = this.buildListTemplate(data);
        this.renderResultsBar(data);
        this.renderResults(content);

        if (this.total > this.limit) {
          // Re-bind the pagination handler if we can paginate.
          this.bindScrollHandler();
        }
      }, this),
      _.bind(this.searchArtistErrorCallback, this)
    );
  };

  /**
   * Renders the message bar with an appropriate results template.
   *
   * @param {Object} data The data returned from the Spotify API.
   * @param {Object} [templateContext] Data to pass to the template being
   *   rendered.
   */
  SpotifyApp.prototype.renderResultsBar = function(data, templateContext) {
    if (this.total === 1) {
      // Don't render anything in the message bar for only 1 result, since
      // it looks silly.
      this.renderMessageBar('');
      return;
    }

    // For the case where we are increasing the `count` while paginating.
    templateContext = _.extend({
      count: data.artists.items.length,
      total: this.total,
      term: this.query,
    }, templateContext);

    // Template chosen depends if the `total` is less than the `limit`, or
    // if we've already paginated to the end.
    var allResults = this.total <= this.limit || templateContext.count === this.total;
    var countTemplate = allResults ? 'result-count-total.hbs' : 'result-count.hbs';
    var messageTpl = Handlebars.templates[countTemplate](templateContext);

    this.renderMessageBar(messageTpl);
  };

  /**
   * Issues a request to the Spotify `/search` endpoint, passing in the
   * `offset` to perform pagination.
   *
   * @param {Object} [params] Query parameters to pass while issuing the
   *   request.
   */
  SpotifyApp.prototype.paginate = function(params) {
    params = _.defaults(params, { offset: this.offset });

    this.searchArtist(params,
      _.bind(function(data) {
        var content = this.buildListTemplate(data);
        var remainder = this.total - this.offset;
        var paginationCount;

        if (remainder < data.artists.limit) {
          // We're at the last page.
          paginationCount = this.total;
          this.unbindScrollHandler();
        } else {
          // We have more pages.
          paginationCount = this.offset + data.artists.limit;
          this.bindScrollHandler();
        }

        this.renderResultsBar(data, { count: paginationCount });
        this.appendResults(content);
      }, this),
      _.bind(this.searchArtistErrorCallback, this)
    );
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
  SpotifyApp.prototype.start = function() {
    if (!this.showPopularArtistsOnStartup) {
      return;
    }

    var _self = this;
    var alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    var ids = {};
    var deferreds = [];
    var loadingTpl = Handlebars.templates['loading.hbs']();

    this.renderMessageBar(loadingTpl);

    _.each(alphabet, function (letter) {
      deferreds.push(_self.searchArtist({ q: letter, limit: 50 }));
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
        _self.renderMessageBar(template);

        if (!hasResults) {
          return;
        }

        var content = _self.buildListTemplate({ artists: { items: results } });
        _self.renderResults(content);
      }).fail(_.bind(_self.searchArtistErrorCallback, _self));
  };

  $(document).ready(function() {
    var auth = new SpotifyAuth(generateRandomString(16));
    auth.authorize();

    var app = new SpotifyApp({
      accessToken: auth.accessToken,
    });
    // Set up event listeners.
    $('[data-searchbutton]').click(app.searchHandler);
    $('[data-searchbar]').keypress(function (e) {
      // e.keyCode is deprecated, but Safari still doesn't support e.key.
      var isEnter = e.keyCode === 13;
      if (isEnter) {
        app.searchHandler();
      }
    });

    app.start();
  });
})();
