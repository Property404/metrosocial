		console.log("Launching");
		// Settings
		const TWITTER_POLL_INTERVAL = 20000;
		const HOST = "metrosocial.hpc.lab:8080/";

		// Lists
		let allPosts = [];
		let mentionTweets = [];

		// Display everything
		function refreshList(){
			let cowList = document.getElementById("CowList");
			allPosts = mentionTweets;
			
			// Update
			$('#CowList').empty();
			for(let p of allPosts)
			{
				let newItem = document.createElement("article");
				newItem.className = "media"
				let html  = `
							<figure class="media-left">
								<p class="image is-64x64">
								<img src="{4}">
								</p>
							</figure>
							<div class="media-content">
								<div class="content">
									<p>
									<strong>{0}</strong> <small>{1}</small> <small>{2}</small>
									<br>
									{3}
									</p>
								</div>
								<nav class="level is-mobile">
									<div class="level-left">
										<a class="level-item">
											<span title="Message privately" class="icon is-small"><i class="fa fa-envelope"></i></span>
										</a>
										<a class="level-item">
											<span title="Respond publically" class="icon is-small"><i class="fa fa-reply"></i></span>
										</a>
									</div>
								</nav>
							</div>
							<div class="media-right">
								<button class="delete"></button>
							</div>
					`;
				newItem.innerHTML = String(html).format(p.name, p.handle, p.time, p.text, p.image);
				console.log(p.image)
				cowList.appendChild(newItem);
			}
		}
		
		// Update mention tweets on frontend
		// Poll twitter every few seconds;
		function pollMentionTweets() {
			setTimeout(updateMentionTweets, TWITTER_POLL_INTERVAL);
		};
		function updateMentionTweets()
		{
				$.ajax({
					type: 'GET',
					dataType: 'json',
					url: 'twitter/timeline',
					success: function(data){
						console.log("Updating mention tweets!");
						mentionTweets = [];
						for(let t of data){
							mentionTweets .push({name:t.user.name, id:
								t.user.id_str, handle: "@"+t.user.screen_name, text: t.text, time:t.created_at,
							image: t.user.profile_image_url.replace("//", "").replace("http:", "http://")});
						}

						console.log(mentionTweets);
						refreshList();
					},
						complete: pollMentionTweets
				});
		}
		// Starting functions
		console.log("Starting for realsies");
		updateMentionTweets();
		pollMentionTweets();
