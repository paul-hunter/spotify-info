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
    
    let fullTrackList = [];

    function mergeObjects(a1, a2) {
        return a1.map(itm => 
            ({ ...a2.find((item) =>
            (item.id === itm.id) && item), ...itm })
        );
    }

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

            fullTrackList.items = mergeObjects(fullTrackList.items, response.audio_features);
            console.log(fullTrackList);

            //document.getElementById('long-term-tracks').innerHTML = songTemplate(fullTrackList);
        }
    });
    }
    
    function calcAudioFeatures(song_data) {
            let features = song_data.items; // Array of objects with feature data
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


    function getSongFeatures(songids, access_tok) {
        $.ajax({
            url: 'https://api.spotify.com/v1/audio-features?ids=' + songids,
            headers: {
            'Authorization': 'Bearer ' + access_tok
            },
            success: function(response) {
                
            }
        });
        }
        
    
    // Handlebars helper that inserts commas for more readable follower numbers
    Handlebars.registerHelper('followers_string', function() {
    let number = this.followers.total;
    return number.toLocaleString();
    });

    // Start song # at 1 instead of 0
    Handlebars.registerHelper('item_num', function(index) {
    return (index + 1);
    });

    Handlebars.registerHelper('album_art', function() {
        // Array of album art images objects {height;width;url}
        // Typically 3 objects of different size images
        let artArray = this.album.images;
        // Album art sorted by width descending order
        let small = artArray[artArray.length-1];
        
        return new Handlebars.SafeString(
            "<img class=\"album-thumb\" src=\"" + small.url + "\" width=\"" + small.width + "\">"
        );
    });
    
    Handlebars.registerHelper('scale', function(value) {
        value = Math.floor(value * 100);
      
        return new Handlebars.SafeString(
          "<div style=\"left: " + value + "%\" class=\"scale-tick\"></div>"
        );
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

    let access_token = document.cookie.replace(/(?:(?:^|.*;\s*)access_token\s*\=\s*([^;]*).*$)|^.*$/, "$1"),
    refresh_token = document.cookie.replace(/(?:(?:^|.*;\s*)refresh_token\s*\=\s*([^;]*).*$)|^.*$/, "$1"),
    error = params.error;



    class spotifyGetter {
        constructor(id, term, limit, offset) {
            if (this.constructor === spotifyGetter) {
                throw new TypeError('Abstract class "spotifyGetter" cannot be instantiated directly.'); 
            }
            this.type = "";
            this.id = id;
            this.term = term;
            this.limit = limit;
            this.offset = offset;
        }

        doWithReturned(response) {
            return response;
        }

        getTop() {

            let doWithReturned = (response) => {
                this.doWithReturned(response);
            }
            return $.ajax({
                url: 'https://api.spotify.com/v1/me/top/' + this.type + '?time_range=' + this.term + '&limit=' + this.limit + '&offset=' + this.offset,
                headers: {
                'Authorization': 'Bearer ' + access_token
                },
            }).done(function(response) {
                doWithReturned(response);
            });
        }
    }

    class getArtists extends spotifyGetter {
        constructor(id, term, limit, offset) {
            super(id, term, limit, offset);
            this.type = ARTISTS;
        }

        doWithReturned(response) {
            document.getElementById(this.id).innerHTML = artistTemplate(response);
        }
    }

    class getTracks extends spotifyGetter {
        constructor(id, term, limit, offset, callback = function() {}){
            super(id, term, limit, offset);
            this.type = TRACKS;
            this.callback = callback;
        }

        doWithReturned(response) {
            let full_track_list = response;
            
            //let id = this.id
            let topSongs = response.items;
            let idList = '';
            for (let i = 0; i < topSongs.length; i++) {
                idList += topSongs[i].id + ',';
            }

            let getSongFeatures = (songids) => {
                $.ajax({
                    url: 'https://api.spotify.com/v1/audio-features?ids=' + songids,
                    headers: {
                    'Authorization': 'Bearer ' + access_token
                    },
                    success: (response) => {
                        
                        full_track_list.items = mergeObjects(full_track_list.items, response.audio_features);
                        
                        document.getElementById(this.id).innerHTML = songTemplate(full_track_list);
                        this.callback(full_track_list);
                    }
                });
            };

            getSongFeatures(idList);

            //console.log(this.full_track_list);
        }

        set setFullTrackList(list) {
            this.full_track_list
        }
    }

    if (error) {
        alert('There was an error during the authentication');
    } else {
          if (access_token) {
            var shortTermArtists = new getArtists('short-term-artists', SHORT, 50, 0).getTop();
            var mediumTermArtists = new getArtists('medium-term-artists', MEDIUM, 50, 0).getTop();
            var longTermArtists = new getArtists('long-term-artists', LONG, 50, 0).getTop();
            var shortTermTracks = new getTracks('short-term-tracks', SHORT, 50, 0).getTop();
            var mediumTermTracks = new getTracks('medium-term-tracks', MEDIUM, 50, 0).getTop();
            var longTermTracks = new getTracks('long-term-tracks', LONG, 50, 0, calcAudioFeatures).getTop();

        /*
        // Short term artist request
        getTop(access_token, ARTISTS, SHORT, 50, 0).done(function(response) {
        document.getElementById('short-term-artists').innerHTML = artistTemplate(response);

        });

        // Medium term artist request
        getTop(access_token, ARTISTS, MEDIUM, 50, 0).done(function(response) {
        document.getElementById('medium-term-artists').innerHTML = artistTemplate(response);
        });
        
        // Long term artist request
        getTop(access_token, ARTISTS, LONG, 50, 0).done(function(response) {
            document.getElementById('long-term-artists').innerHTML = artistTemplate(response);
        });
        
        // Short term tracks request
        getTop(access_token, TRACKS, SHORT, 50, 0).done(function(response) {
        document.getElementById('short-term-tracks').innerHTML = songTemplate(response);

        });

        // Medium term tracks request
        getTop(access_token, TRACKS, MEDIUM, 50, 0).done(function(response) {
        document.getElementById('medium-term-tracks').innerHTML = songTemplate(response);
    
        });
        */

        // Long term tracks request (default view)
        getTop(access_token, TRACKS, LONG, 50, 0).done(function(response) {
            // combine ids from songs to call api to get song features
            //document.getElementById('long-term').innerHTML = songTemplate(response);
            //console.log(response);
            
            let topSongs = response.items;
            let idList = '';
            for (let i = 0; i < topSongs.length; i++) {
                idList += topSongs[i].id + ',';
                fullTrackList = response;
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

    function getTogglerChecked() {
            $('.list-chunk').removeClass("shown");
            let track_album, duration;

            document.querySelectorAll(".track-album").forEach(element => {
                if (element.querySelector('input').checked) {
                    track_album = element.querySelector('input').dataset.getter;
                    element.classList.add("checked");
                } else {
                    if (element.classList.contains("checked")) element.classList.remove("checked");
                }
            });

            document.querySelectorAll(".duration").forEach(element => {
                if (element.querySelector('input').checked) {
                    duration = element.querySelector('input').dataset.getter;
                    element.classList.add("checked");
                } else {
                    if (element.classList.contains("checked")) element.classList.remove("checked");
                }
            });

            let id = '#' + duration + track_album;
            console.log(id);
            $(id).addClass("shown");
    }

    getTogglerChecked();
    document.querySelectorAll(".toggle-thinger").forEach(element => {
        element.addEventListener('click', getTogglerChecked, false);
    });
    }
})();
