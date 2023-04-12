function addFeedFilters(){
	if(!location.pathname.match(/^\/home\/?$/)){
		return
	}
	let filterBox = document.querySelector(".hohFeedFilter");
	if(filterBox){
		return
	}
	let activityFeedWrap = document.querySelector(".activity-feed-wrap");
	if(!activityFeedWrap){
		setTimeout(addFeedFilters,100);
		return
	}
	let activityFeed = activityFeedWrap.querySelector(".activity-feed");
	if(!activityFeed){
		setTimeout(addFeedFilters,100);
		return
	}
	let commentFilterBoxInput;
	let likeFilterBoxInput;
	let allFilterBox;
	let blockList = localStorage.getItem("blockList");
	if(blockList){
		blockList = JSON.parse(blockList)
	}
	else{
		blockList = []
	}
	let postRemover = function(){
		if(!location.pathname.match(/^\/home\/?$/)){
			return
		}
		[...activityFeed.children].forEach(post => {
			if(post.querySelector(".el-dialog__wrapper")){
				return
			}
			let actionLikes = post.querySelector(".action.likes .button .count");
			if(actionLikes){
				actionLikes = parseInt(actionLikes.innerText)
			}
			else{
				actionLikes = 0
			}
			let actionReplies = post.querySelector(".action.replies .count");
			if(actionReplies){
				actionReplies = parseInt(actionReplies.innerText)
			}
			else{
				actionReplies = 0
			}
			let blockRequire = true;
			if(useScripts.blockWord && post.classList.contains("activity-text")){
				try{
					if(post.querySelector(".activity-markdown").innerText.match(new RegExp(useScripts.blockWordValue,"i"))){
						blockRequire = false
					}
				}
				catch(err){
					if(post.querySelector(".activity-markdown").innerText.toLowerCase().match(useScripts.blockWordValue.toLowerCase())){
						blockRequire = false
					}
				}
			}
			if(useScripts.statusBorder){
				let blockerMap = {
					"plans": "PLANNING",
					"watched": "CURRENT",
					"read": "CURRENT",
					"completed": "COMPLETED",
					"paused": "PAUSED",
					"dropped": "DROPPED",
					"rewatched": "REPEATING",
					"reread": "REPEATING"
				};
				let blockerClassMap = {
					"activityPlanning": "PLANNING",
					"activityWatching": "CURRENT",
					"activityReading": "CURRENT",
					"activityCompleted": "COMPLETED",
					"activityPaused": "PAUSED",
					"activityDropped": "DROPPED",
					"activityRewatching": "REPEATING",
					"activityRewatched": "REPEATING",
					"activityRereading": "REPEATING",
					"activityReread": "REPEATING"
				};
				if(post.classList.contains("activity-anime_list") || post.classList.contains("activity-manga_list")){
					let status = blockerClassMap[
							post.querySelector(".status").classList[1]
						] || blockerMap[
						Object.keys(blockerMap).find(
							key => post.querySelector(".status").innerText.toLowerCase().includes(key)
						)
					]
					if(status === "CURRENT"){
						post.children[0].style.borderRightWidth = "0px";
						post.children[0].style.marginRight = "0px"
					}
					else if(status === "COMPLETED"){
						post.children[0].style.borderRightStyle = "solid";
						post.children[0].style.borderRightWidth = "5px";
						if(useScripts.CSSgreenManga && post.classList.contains("activity-anime_list")){
							post.children[0].style.borderRightColor = "rgb(var(--color-blue))"
						}
						else{
							post.children[0].style.borderRightColor = "rgb(var(--color-green))"
						}
						post.children[0].style.marginRight = "-5px"
					}
					else{
						post.children[0].style.borderRightStyle = "solid";
						post.children[0].style.borderRightWidth = "5px";
						post.children[0].style.marginRight = "-5px";
						post.children[0].style.borderRightColor = distributionColours[status];
					}
				}	
			}
			const statusCheck = {
				"planning": /^plans/i,
				"watching": /^watched/i,
				"reading": /^read/i,
				"completing": /^completed/i,
				"pausing": /^paused/i,
				"dropping": /^dropped/i,
				"rewatching": /^rewatched/i,
				"rereading": /^reread/i
			}
			if(
				(!useScripts.feedCommentFilter || (
					actionLikes >= likeFilterBoxInput.value
					&& (likeFilterBoxInput.value >= 0 || actionLikes < -likeFilterBoxInput.value)
					&& actionReplies >= commentFilterBoxInput.value
					&& (commentFilterBoxInput.value >= 0 || actionReplies < -commentFilterBoxInput.value)
				))
				&& blockRequire
				&& blockList.every(
					blocker => (
						blocker.user
						&& post.querySelector(".name").textContent.trim().toLowerCase() !== blocker.user.toLowerCase()
					)
					|| (
						blocker.media
						&& (
							post.classList.contains("activity-text")
							|| post.querySelector(".status .title").href.match(/\/(anime|manga)\/(\d+)/)[2] !== blocker.media
						)
					)
					|| (
						blocker.status
						&& (
							post.classList.contains("activity-text")
							|| blocker.status == "status"
							|| (
								blocker.status === "anime"
								&& !post.classList.contains("activity-anime_list")
							)
							|| (
								blocker.status === "manga"
								&& !post.classList.contains("activity-manga_list")
							)
							|| (
								statusCheck[blocker.status]
								&& !post.querySelector(".status").textContent.trim().match(statusCheck[blocker.status])
							)
						)
					)
				)
			){
				if(
					useScripts.SFWmode
					&& post.classList.contains("activity-text")
					&& badWords.some(word => post.querySelector(".activity-markdown").innerText.match(word))
				){
					post.style.opacity= 0.5
				}
				else{
					post.style.display = ""
				}
			}
			else{
				post.style.display = "none"
			}
		})
	};
	let postTranslator = function(){
		Array.from(activityFeed.children).forEach(activity => {
			try{
				let timeElement = activity.querySelector(".time time");
				if(timeElement && !timeElement.classList.contains("hohTimeGeneric")){
					let seconds = new Date(timeElement.dateTime).valueOf()/1000;
					let replacement = nativeTimeElement(seconds);
					timeElement.style.display = "none";
					replacement.style.position = "relative";
					replacement.style.right = "unset";
					replacement.style.top = "unset";
					timeElement.parentNode.insertBefore(replacement, timeElement)
				}
			}
			catch(e){
				console.warn("time element translation is broken")
			}
			let statusParent = activity.querySelector(".status");
			if(!statusParent){
				return
			}
			let status = statusParent.childNodes[0];
			let cont = status.textContent.trim().match(/(.+?)(\s(\d+|\d+ - \d+) of)?$/);
			if(cont){
				let prog = cont[3];
				let type = cont[1];
				if(activity.classList.contains("activity-anime_list")){
					if(type === "Completed"){
						status.textContent = translate("$listActivity_completedAnime");
						statusParent.classList.add("activityCompleted")
					}
					else if(type === "Watched episode" && prog){
						status.textContent = translate("$listActivity_MwatchedEpisode",prog);
						statusParent.classList.add("activityWatching")
					}
					else if(type === "Dropped" && prog){
						status.textContent = translate("$listActivity_MdroppedAnime",prog);
						statusParent.classList.add("activityDropped")
					}
					else if(type === "Dropped"){
						status.textContent = translate("$listActivity_droppedAnime");
						statusParent.classList.add("activityDropped")
					}
					else if(type === "Rewatched episode" && prog){
						status.textContent = translate("$listActivity_MrepeatingAnime",prog);
						statusParent.classList.add("activityRewatching")
					}
					else if(type === "Rewatched"){
						status.textContent = translate("$listActivity_repeatedAnime");
						statusParent.classList.add("activityRewatched")
					}
					else if(type === "Paused watching"){
						status.textContent = translate("$listActivity_pausedAnime");
						statusParent.classList.add("activityPaused")
					}
					else if(type === "Plans to watch"){
						status.textContent = translate("$listActivity_planningAnime");
						statusParent.classList.add("activityPlanning")
					}
				}
				else if(activity.classList.contains("activity-manga_list")){
					if(type === "Completed"){
						status.textContent = translate("$listActivity_completedManga");
						statusParent.classList.add("activityCompleted")
					}
					else if(type === "Read chapter" && prog){
						status.textContent = translate("$listActivity_MreadChapter",prog);
						statusParent.classList.add("activityReading")
					}
					else if(type === "Dropped" && prog){
						status.textContent = translate("$listActivity_MdroppedManga",prog);
						statusParent.classList.add("activityDropped")
					}
					else if(type === "Dropped"){
						status.textContent = translate("$listActivity_droppedManga");
						statusParent.classList.add("activityDropped")
					}
					else if(type === "Reread chapter" && prog){
						status.textContent = translate("$listActivity_MrepeatingManga",prog);
						statusParent.classList.add("activityRereading")
					}
					else if(type === "Reread"){
						status.textContent = translate("$listActivity_repeatedManga");
						statusParent.classList.add("activityReread")
					}
					else if(type === "Paused reading"){
						status.textContent = translate("$listActivity_pausedManga");
						statusParent.classList.add("activityPaused")
					}
					else if(type === "Plans to read"){
						status.textContent = translate("$listActivity_planningManga");
						statusParent.classList.add("activityPlanning")
					}
				}
				if(useScripts.partialLocalisationLanguage === "日本語"){
					statusParent.classList.add("hohReverseTitle")
				}
			}
		})
	}
	if(useScripts.feedCommentFilter){
		filterBox = create("div","hohFeedFilter",false,activityFeedWrap);
		create("span","hohDescription","At least ",filterBox);
		activityFeedWrap.style.position = "relative";
		activityFeedWrap.children[0].childNodes[0].nodeValue = "";
		commentFilterBoxInput = create("input",false,false,filterBox);
		commentFilterBoxInput.type = "number";
		commentFilterBoxInput.value = useScripts.feedCommentComments;
		create("span",false," comments, ",filterBox);
		likeFilterBoxInput = create("input",false,false,filterBox);
		likeFilterBoxInput.type = "number";
		likeFilterBoxInput.value = useScripts.feedCommentLikes;
		create("span",false," likes",filterBox);
		allFilterBox = create("button",false,"⟳",filterBox,"padding:0px;");
		commentFilterBoxInput.onchange = function(){
			useScripts.feedCommentComments = commentFilterBoxInput.value;
			useScripts.save();
			postRemover();
		};
		likeFilterBoxInput.onchange = function(){
			useScripts.feedCommentLikes = likeFilterBoxInput.value;
			useScripts.save();
			postRemover();
		};
		allFilterBox.onclick = function(){
			commentFilterBoxInput.value = 0;
			likeFilterBoxInput.value = 0;
			useScripts.feedCommentComments = 0;
			useScripts.feedCommentLikes = 0;
			useScripts.save();
			postRemover();
		};
	}
	let mutationConfig = {
		attributes: false,
		childList: true,
		subtree: false
	};
	let observer = new MutationObserver(function(){
		postRemover();
		if(useScripts.additionalTranslation && useScripts.partialLocalisationLanguage !== "English"){
			postTranslator()
		}
		setTimeout(postRemover,500);
	});
	observer.observe(activityFeed,mutationConfig);
	let observerObserver = new MutationObserver(function(){//Who police police? The police police police police
		activityFeed = activityFeedWrap.querySelector(".activity-feed");
		if(activityFeed){
			observer.disconnect();
			observer = new MutationObserver(function(){
				postRemover();
				if(useScripts.additionalTranslation && useScripts.partialLocalisationLanguage !== "English"){
					postTranslator()
				}
				setTimeout(postRemover,500);
			});
			observer.observe(activityFeed,mutationConfig);
		}
	});
	observerObserver.observe(activityFeedWrap,mutationConfig);
	postRemover();
	if(useScripts.additionalTranslation && useScripts.partialLocalisationLanguage !== "English"){
		postTranslator()
	}
	let waiter = function(){
		setTimeout(function(){
			if(location.pathname.match(/^\/home\/?$/)){
				postRemover();
				waiter();
			}
		},5*1000);
	};waiter();
}
