		console.log("Launching");
		// Settings
		const TWITTER_POLL_INTERVAL = 20000;
		const HOST = "metrosocial.hpc.lab:8080/";

		// Lists
		let allPosts = [];
		let mentionTweets = [];

		// Display everything
		function refreshList(){
			$('#CowList').empty();
			let cowList = document.getElementById("CowList");
			allPosts = mentionTweets;
			
			for(let p of mentionTweets)
			{
				let newItem = document.createElement("li");
				newItem.appendChild(document.createTextNode(p.text));
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
						mentionTweets = data;
						refreshList();
					},
						complete: pollMentionTweets
				});
		}
		// Starting functions
		console.log("Starting for realsies");
		updateMentionTweets();
		pollMentionTweets();
