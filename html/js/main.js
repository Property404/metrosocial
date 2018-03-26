console.log("starting");
// Settings
const TWITTER_POLL_INTERVAL = 30000;
const HOST = "metrosocial.hpc.lab:8080/";

// Lists
let allPosts = [];
let mentionTweets = [];
let usedIds = []

// Display everything
function refreshList(){
	let cowList = document.getElementById("CowList");
	allPosts = mentionTweets;

	// Update
	for(let p of allPosts)
	{
		if(usedIds.includes(p.id)){
			continue;
		}else{
			usedIds.push(p.id);
		}
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
			<span onClick="$('#{5}').show();id_{5}_is_private=true;" title="Message privately" class="icon is-small"><i class="fa fa-envelope"></i></span>
			</a>
			<a class="level-item">
			<span onClick="$('#{5}').show();id_{5}_is_private=false;" title="Respond publically" class="icon is-small"><i class="fa fa-reply"></i></span>
			</a>
			</div>
			</nav>
			<div class="field" hidden=true id='{5}'>
			<p class="control">
			<textarea id='ta_{5}' class="textarea" placeholder = "reply..."></textarea>
			</p>
			<a class="button is-info" onClick="(id_{5}_is_private?postTwitterMessage:postTweet)('{1}', '{5}', '{1} '+document.getElementById('ta_{5}').value);">Respond</a>
			</div>
			</div>
			<div class="media-right">
			<button onClick="ignoreId('{5}')" class="delete"></button>
			</div>
			`;
		newItem.innerHTML = String(html).format(p.name, p.handle, p.time, p.text, p.image, p.id) 
		cowList.prepend(newItem);
	}
}

// Ignore an id
function ignoreId(id){
	$.ajax({
		type: 'POST',
		dataType: 'json',
		url: 'api/ignoreid/',
		data: {"id":id},
		success: function(data){
			console.log("Ignoring id");
			usedIds = [];
			updateMentionTweets();
		},
	});

}

// Post Tweet in response
function postTweet(screen_name, id, status){
	console.log(id);
	console.log(status);
	$.ajax({
		type: 'POST',
		dataType: 'json',
		url: 'twitter/tweet/',
		data: {"id":id, "status":status},
		success: function(data){
			console.log("Posted successfully")
			usedIds = [];
			updateMentionTweets();
		},
	});
}

// Post Tweet in response
function postTwitterMessage(screen_name, id, status){
	$.ajax({
		type: 'POST',
		dataType: 'json',
		url: 'twitter/message/',
		data: {"screen_name": screen_name, "id":id, "status":status},
		success: function(data){
			if(data.status == 200){
				console.log("Sent successfully")
				usedIds = [];
				updateMentionTweets();
			}else{
				alert("You can't respond privately to a Twitter user who isn't following you...");
			}
			
		},
	});
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
			mentionTweets = [];
			for(let t of data){
				mentionTweets .push({name:t.user.name, id:
					t.id_str, handle: "@"+t.user.screen_name, text: t.text, time:t.created_at,
					image: t.user.profile_image_url.replace("//", "").replace("http:", "http://")});
			}
			mentionTweets.reverse();

			refreshList();
		},
		complete: pollMentionTweets
	});
}
// Starting functions
updateMentionTweets();
pollMentionTweets();
