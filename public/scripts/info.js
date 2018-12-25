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

    //trying to make requests more modular
    //deal with later
    /*
      const ARTISTS = 'artists';
      const TRACKS = 'tracks';
      
      const LONG = 'long_term';
      const MEDIUM = 'medium_term';
      const SHORT = 'short_term';

      // type: ARTISTS, TRACKS
      // term: LONG, MEDIUM, SHORT
      // limit: int range 0-50
      function topTracks(type, term, limit) {
      $.ajax({
      url: 'https://api.spotify.com/v1/me/top/' + type + '?time_range=' + term + '&limit=' + limit,
      headers: {
      'Authorization': 'Bearer ' + access_token
      },
      success: function(response) {
      $('#login').hide();
      $('#loggedin').show();
      }
      })
      }
    */

    // gets song features for top songs and
    // songids is a comma separated string 
    function getSongFeatures(songids, access_tok) {
	$.ajax({
	    url: 'https://api.spotify.com/v1/audio-features?ids=' + songids,
	    headers: {
		'Authorization': 'Bearer ' + access_tok
	    },
	    success: function(response) {
		console.log(response); //temp

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
			console.log(i+1); // temp - to see which songs are marked as instrumental
		    }
		}

		valenceAvg /= features.length;
		danceAvg /= features.length;
		energyAvg /= features.length;

		let featuresData = {valence: valenceAvg, danceability: danceAvg, energy: energyAvg,
				    instrumentals: instrumentalCount};
		console.log(featuresData);
		featuresPlaceholder.innerHTML = featuresTemplate(featuresData);
	    }
	});
    }
    
    let listSource = document.getElementById('list-template').innerHTML,
	listTemplate = Handlebars.compile(listSource),
	shortTermPlaceholder = document.getElementById('short-term'),
	mediumTermPlaceholder = document.getElementById('medium-term'),
	longTermPlaceholder = document.getElementById('long-term');

    let featuresSource = document.getElementById('features-template').innerHTML,
	featuresTemplate = Handlebars.compile(featuresSource),
	featuresPlaceholder = document.getElementById('features');
    
    let oauthSource = document.getElementById('oauth-template').innerHTML,
	oauthTemplate = Handlebars.compile(oauthSource),
	oauthPlaceholder = document.getElementById('oauth');
    
    let params = getHashParams();

    let access_token = params.access_token,
	refresh_token = params.refresh_token,
	error = params.error;

    if (error) {
	alert('There was an error during the authentication');
    } else {
	if (access_token) {
 	    // render oauth info
	    oauthPlaceholder.innerHTML = oauthTemplate({
		access_token: access_token,
		refresh_token: refresh_token
	    });

	    // Short term request
	    $.ajax({
		url: 'https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=50',  // Need to modify this
		headers: {
		    'Authorization': 'Bearer ' + access_token
		},
		success: function(response) {
		    // handlebars object getting used here from above
		    // with the data from the api call
		    shortTermPlaceholder.innerHTML = listTemplate(response);
		    $('#short-term').hide();
		}
	    });
	    
	    // Medium term request
	    $.ajax({
		url: 'https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=50',
		headers: {
		    'Authorization': 'Bearer ' + access_token
		},
		success: function(response) {
		    // handlebars object getting used here from above
		    // with the data from the api call
		    mediumTermPlaceholder.innerHTML = listTemplate(response);
		    $('#medium-term').hide();
		}
	    });
	    
	    // Long term request
	    $.ajax({
		url: 'https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=50',
		headers: {
		    'Authorization': 'Bearer ' + access_token
		},
		success: function(response) {
		    // handlebars object getting used here from above
		    // with the data from the api call
		    longTermPlaceholder.innerHTML = listTemplate(response);

		    let topSongs = response.items;
		    console.log(topSongs); // temporary
		    let idList = '';
		    
		    for (let i = 0; i < topSongs.length; i++) {
			idList += topSongs[i].id + ',';
		    }

		    console.log(idList) // temporary
		    // request to get song information
		    getSongFeatures(idList, access_token);
		    
		    $('#login').hide();
		    $('#loggedin').show();
		}
	    });
	} else {
	    // render initial screen
	    $('#login').show();
	    $('#loggedin').hide();
	}

	document.getElementById('short-toggle').addEventListener('click', function () {
	    $('#medium-term').hide();
	    $('#long-term').hide();
	    $('#short-term').show();
	});
	
	document.getElementById('medium-toggle').addEventListener('click', function () {
	    $('#short-term').hide();
	    $('#long-term').hide();
	    $('#medium-term').show();
	});

	document.getElementById('long-toggle').addEventListener('click', function () {
	    $('#short-term').hide();
	    $('#medium-term').hide();
	    $('#long-term').show();
	});	
	
	document.getElementById('obtain-new-token').addEventListener('click', function() {
	    $.ajax({
		url: '/refresh_token',
		data: {
		    'refresh_token': refresh_token
		}
	    }).done(function(data) {
		access_token = data.access_token;
		oauthPlaceholder.innerHTML = oauthTemplate({
		    access_token: access_token,
		    refresh_token: refresh_token
		});
	    });
	}, false);
    }
})();
