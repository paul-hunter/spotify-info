(function() {

    /*
     * Obtains parameters from the hash of the URL
     * @return Object
     */
    function getHashParams() {
	var hashParams = {};
	var e, r = /([^&;=]+)=?([^&;]*)/g,
	    q = window.location.hash.substring(1);
	while ( e = r.exec(q)) {
	    hashParams[e[1]] = decodeURIComponent(e[2]);
	}
	return hashParams;
    }

    const ARTISTS = 'artists';
    const TRACKS = 'tracks';
    const LONG = 'long_term';
    const MEDIUM = 'medium_term';
    const SHORT = 'short_term';

    // type: ARTISTS, TRACKS
    // term: LONG, MEDIUM, SHORT
    // limit: int range 0-50
    // offset: int range 0-49 it appears
    function getTop(access_token, type, term, limit, offset) {
	return $.ajax({
	    url: 'https://api.spotify.com/v1/me/top/' + type + '?time_range=' + term + '&limit=' + limit + '&offset=' + offset,
	    headers: {
		'Authorization': 'Bearer ' + access_token
	    },
	});
    }

    // gets song features for top songs and
    // songids is a comma separated string 
    function getSongFeatures(songids, access_tok) {
	$.ajax({
	    url: 'https://api.spotify.com/v1/audio-features?ids=' + songids,
	    headers: {
		'Authorization': 'Bearer ' + access_tok
	    },
	    success: function(response) {
		let features = response.audio_features; // Array of objects with feature data
		let valenceAvg = 0,
		    danceAvg = 0,
		    energyAvg = 0;

		let instrumentalCount = 0;

		for (let i = 0; i < features.length; i++) {
		    valenceAvg += features[i].valence;
		    danceAvg += features[i].danceability;
		    energyAvg += features[i].energy;
		    if (features[i].instrumentalness > .7 ) {
			instrumentalCount++;
		    }
		}

		valenceAvg /= features.length;
		danceAvg /= features.length;
		energyAvg /= features.length;

		let featuresData = {valence: valenceAvg, danceability: danceAvg, energy: energyAvg,
				    instrumentals: instrumentalCount};
		featuresPlaceholder.innerHTML = featuresTemplate(featuresData);
	    }
	});
    }

    // Handlebars helper that inserts commas for more readable follower numbers
    Handlebars.registerHelper('followers_string', function() {
	let number = Number(Handlebars.escapeExpression(this.followers.total));
	return new Handlebars.SafeString(number.toLocaleString());
    });
    
    // Set up handlebars templates
    let songSource = document.getElementById('song-template').innerHTML,
	songTemplate = Handlebars.compile(songSource),
	artistSource = document.getElementById('artist-template').innerHTML,
	artistTemplate = Handlebars.compile(artistSource);

    let featuresSource = document.getElementById('features-template').innerHTML,
	featuresTemplate = Handlebars.compile(featuresSource),
	featuresPlaceholder = document.getElementById('features');
        
    let params = getHashParams();

    let access_token = params.access_token,
	refresh_token = params.refresh_token,
	error = params.error;

    if (error) {
	alert('There was an error during the authentication');
    } else {
      	if (access_token) {
	    // Short term artist request
	    getTop(access_token, ARTISTS, SHORT, 50, 0).done(function(response) {
		document.getElementById('short-term-artists').innerHTML = artistTemplate(response);
		$('#short-term-artists').hide();
	    });

	    // Medium term artist request
	    getTop(access_token, ARTISTS, MEDIUM, 50, 0).done(function(response) {
		document.getElementById('medium-term-artists').innerHTML = artistTemplate(response);
		$('#medium-term-artists').hide();
	    });
	    
	    // Long term artist request
	    getTop(access_token, ARTISTS, LONG, 50, 0).done(function(response) {
		document.getElementById('long-term-artists').innerHTML = artistTemplate(response);
		$('#long-term-artists').hide();
	    });
	    
	    // Short term tracks request
	    getTop(access_token, TRACKS, SHORT, 50, 0).done(function(response) {
		document.getElementById('short-term').innerHTML = songTemplate(response);
		$('#short-term').hide();
	    });

	    // Medium term tracks request
	    getTop(access_token, TRACKS, MEDIUM, 50, 0).done(function(response) {
		document.getElementById('medium-term').innerHTML = songTemplate(response);
		$('#medium-term').hide();
	    });

	    // Long term tracks request (default view)
	    getTop(access_token, TRACKS, LONG, 50, 0).done(function(response) {
		document.getElementById('long-term').innerHTML = songTemplate(response);
		
		// combine ids from songs to call api to get song features
		let topSongs = response.items;
		let idList = '';
		for (let i = 0; i < topSongs.length; i++) {
		    idList += topSongs[i].id + ',';
		}

		// request to get song information
		getSongFeatures(idList, access_token);
		
		$('#login').hide();
		$('#loggedin').show();
	    });

	} else {
	    // render initial screen
	    $('#login').show();
	    $('#loggedin').hide();
	}

	// This can't be good code ... figure out better way later along with drop down
	document.getElementById('short-toggle').addEventListener('click', function () {
	    $('#short-term-artists').hide();
	    $('#medium-term-artists').hide();
	    $('#long-term-artists').hide();
	    $('#short-term').show();
	    $('#medium-term').hide();
	    $('#long-term').hide();
	});
	
	document.getElementById('medium-toggle').addEventListener('click', function () {
	    $('#short-term-artists').hide();
	    $('#medium-term-artists').hide();
	    $('#long-term-artists').hide();
	    $('#short-term').hide();
	    $('#medium-term').show();
	    $('#long-term').hide();
	});

	document.getElementById('long-toggle').addEventListener('click', function () {
	    $('#short-term-artists').hide();
	    $('#medium-term-artists').hide();
	    $('#long-term-artists').hide();
	    $('#short-term').hide();
	    $('#medium-term').hide();
	    $('#long-term').show();
	});	

	document.getElementById('short-toggle-artists').addEventListener('click', function () {
	    $('#short-term-artists').show();
	    $('#medium-term-artists').hide();
	    $('#long-term-artists').hide();
	    $('#short-term').hide();
	    $('#medium-term').hide();
	    $('#long-term').hide();
	});	

	document.getElementById('medium-toggle-artists').addEventListener('click', function () {
	    $('#short-term-artists').hide();
	    $('#medium-term-artists').show();
	    $('#long-term-artists').hide();
	    $('#short-term').hide();
	    $('#medium-term').hide();
	    $('#long-term').hide();
	});	

	document.getElementById('long-toggle-artists').addEventListener('click', function () {
	    $('#short-term-artists').hide();
	    $('#medium-term-artists').hide();
	    $('#long-term-artists').show();
	    $('#short-term').hide();
	    $('#medium-term').hide();
	    $('#long-term').hide();
	});
    }
})();
