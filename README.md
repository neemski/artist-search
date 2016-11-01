Spotify Artist Search
=========

This fully client-side application leverages the [Spotify Search API](https://developer.spotify.com/web-api/search-item/) to allow users to search for an artist:

![Screenshot](artist-search.png?raw=true "Main page")

## Setup

1. Run `npm install` to install all the node dependencies.

2. Run `npm start` to precompile the Handlebars templates, and start the http server.

3. Go to `http://localhost:3000`.

4. Search away, friend.

## Features
1. Displays popular artists on first load.
2. Searching for artists on Spotify, displaying relevant attributes like popularity and number of followers.
3. "Infinite" scrolling.
4. Responsive CSS design via media queries, CSS flexbox, etc.

## Technologies Used
* HTML, CSS, JavaScript
* [jQuery](http://jquery.com/)
* [Handlebars.js](http://handlebarsjs.com/)
* [Lodash.js](https://lodash.com/)
* [Font Awesome](http://fontawesome.io/)
* [Bootstrap](http://getbootstrap.com/)

## TODO
* Clean up CSS code using a pre-processor like [Less](http://lesscss.org/).
