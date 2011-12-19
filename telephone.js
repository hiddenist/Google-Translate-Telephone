/* Create an object so we don't dirty the namespace */
var telephone = {};

/* Apparently not all languages in google.language.Languages are valid , so lets use our own list */
telephone.validLanguages = ['af','it','sq','ja','ar','ko','be','lv','bg','lt','ca','mk','zh','zh-CN','zh-TW','ms','mt','no','hr','fa','cs','pl','da','pt','nl',,'en','ro','et','ru','tl','sr','fi','sk','fr','sl','gl','es','de','sw','el','sv','ht','tl','iw','th','hi','tr','hu','uk','is','vi','id','cy','ga','yi'];

/* This is a list of languages with hilarious translations */
telephone.funLanguages = ['ko', 'ja', 'sl', 'zh', 'vi', 'fi', 'et'];

/**
*	Translate the text into each of the given languages and back, telephone style.
*	Handle the results with the provided handler function.
*/
telephone.translate = function (text, orig, languages, resultHandler, callback) {
	// Create an interior recursive function to handle the callbacks
	if (typeof callback != "function")
		callback = function() {};
		
	var translateHelper = function(text, from, to) {
		google.language.translate(text, from, to, 
			function (result) {
				resultHandler(from, to, result);

				// Break if we got no translation text
				if (!result.translation) {
					callback();
					return;
				}

				// If we happen to have our source language in the list, don't use it or we'll have an infinite loop
				// Todo: what's a better solution to this?
				if (from == orig && to != orig)
					next = orig;
				else {
					
					do {
						next = languages.pop();
					} while (next == orig);
				}

				if (next)
					translateHelper(result.translation, to, next);
				else
					callback();
			}
		);
	};

	// Set up the initial values and make the initial call
	translateHelper(text, orig, languages.pop());

};

/**
* Select random, distinct numbers within a range or supplied array
*
* The options array may contain either a "pool" property, assigned to an array, or "lowerBounds" and "upperBounds" properties.  By default, with no options provided, this will provide numbers between 0 and 100.
* The options array may also provide a "validation" function to potentially discount a chosen entry.
*/
telephone.distinctRandom = function (quantity, options) {
	var defaultOptions = {
		lowerBounds: 0,
		upperBounds: 100,
		validation: function () { return true; }
	};

	jQuery.extend(options, defaultOptions);
	// Clone a pool, if provided (our algorithm is destructive on the pool).  Otherwise, create one as a range of integers.
	var pool;
	if (options.pool) {
		pool = options.pool.slice(0);
	} else {

		// Populate a pool of choices
		pool = [];
		for (var i = options.lowerBounds; i < options.upperBounds; ++i) {
			if (options.validation(i))
				pool.push(i);
		}
	}

	// Throw an error instead, maybe?
	if (quantity > pool.length)
		return false;

	// Select a random number within the active section of the pool, save it, and replace it with a number from the begining of the array.  Continue this until we hit our quantity, reducing the active section of the pool as we go.
	var result = [];
	for (var i = 0; i < quantity; ++i) {
		var rand = i + Math.floor(Math.random() * (pool.length - i));
		var selected = pool[rand];
		
		// Take a value if it's valid - otherwise, discount this iteration and increase the number of iterations if it won't exceed the size of the pool
		if (options.validation(selected))
			result.push(pool[rand]);
		else if (quantity < pool.length)
			++quantity;
			
		pool[rand] = pool[i];
	}

	// Return the chosen numbers
	return result;
}

$(document).ready( function () {

	google.language.getBranding($("#google-branding")[0]);
	
	var running = false;
	
	$("#translate").click( function() {
		var input = $("#input").val();

		if (!input.length) {
			alert("You have to enter something!");
			return;
		}

		if (!running) {
			running = true;
			$("#translate").attr('disabled','disabled');
		}
		else
			return; // Already running

		var display = $("#translation");
		var loading = $("#loading");
		loading.html("Loading...");


		display.html("<div id='original' class='orig translation'><div class='lang-used'>Original Entry</div>" + input + "</div>");

		// Detect the input language because we're awesome
		google.language.detect(input, 
			function (result) {
				var lang = result.language;
				
				// Choose random languages from our language list, and disclude the detected language
				var numLanguages = 5;
				var languages = telephone.distinctRandom(numLanguages, { pool: telephone.validLanguages, validation: function (chosen) { return chosen != lang; } });
				
				telephone.translate(input, lang, languages,
					function (from, to, result) {
						if (result.error) {
							display.append("<p>Error: " + result.error.message + " | from: " + from + "; to: " + to + "</p>");
						} else {
							display.append(
								$(document.createElement('div'))
									.addClass('translation from-' + from + ' to-' + to + (lang == to? " orig" : ""))
									.html(result.translation)
									.prepend(
										$(document.createElement('div'))
											.addClass('lang-used')
											.append("From " + from + " to " + to)
									)
							);
						}
					},
					function () { 
						loading.html("&nbsp;");
						$("#translate").removeAttr('disabled');
						running = false;
					}
				);
			}
		);

	});
});
