async function addForumMediaNoAWC(){
	if(location.pathname !== "/home"){
		return
	}
	let buildPreview = function(data){
		if(location.pathname !== "/home"){
			return
		}
		let forumPreview = document.querySelector(".recent-threads .forum-wrap");
		if(!(forumPreview && forumPreview.childElementCount)){
			setTimeout(function(){buildPreview(data)},400);
			return;
		}
		forumPreview.classList.add("hohNoAWC");
		removeChildren(forumPreview)
		data.Page.threads.filter(
			thread => !(
				(useScripts.hideAWC && thread.title.match(/^(AWC|Anime\sWatching\s(Challenge|Club)|MRC)/))
				|| (useScripts.hideOtherThreads && thread.title.match(/(Boys\svs\sGirls|New\sUser\sIntro\sThread|Support\sAniList\s&\sAniChart|Where\scan\sI\s(watch|read|find))/i))
			)
		).slice(0,parseInt(useScripts.forumPreviewNumber)).forEach(thread => {
			let card = create("div",["thread-card","small"],false,forumPreview);
			create("a","title",thread.title,card).href = "/forum/thread/" + thread.id;
			let footer = create("div","footer",false,card);
			let avatar = create("a","avatar",false,footer);
			avatar.href = "/user/" + (thread.replyUser || thread.user).name;
			avatar.style.backgroundImage = "url(\"" + (thread.replyUser || thread.user).avatar.large + "\")";
			let name = create("div","name",false,footer);
			if(thread.replyCount === 0){
				let contextText = create("a",false,translate("$particle_by"),name);
				name.appendChild(document.createTextNode(" "));
				let nameWrap = create("a",false,false,name);
				nameWrap.href = (thread.replyUser || thread.user).name;
				contextText.href = "/forum/thread/" + thread.id + "/comment/" + thread.replyCommentId;
				create("span",false,(thread.replyUser || thread.user).name,nameWrap);
			}
			else if(!thread.replyUser){
				let contextText = create("a",false,translate("$particle_by"),name);
				name.appendChild(document.createTextNode(" "));
				let nameWrap = create("a",false,false,name);
				nameWrap.href = "/user/" + thread.user.name;
				contextText.href = "/forum/thread/" + thread.id;
				create("span",false,thread.user.name,nameWrap);
			}
			else{
				let nameWrap = create("a",false,false,name);
				nameWrap.href = "/user/" + thread.replyUser.name;
				create("span",false,thread.replyUser.name,nameWrap);
				name.appendChild(document.createTextNode(" "));
				let contextText = create("a",false,translate("$forum_preview_reply"),name);
				contextText.href = "/forum/thread/" + thread.id + "/comment/" + thread.replyCommentId;
				let timer = nativeTimeElement(thread.repliedAt);
				timer.style.position = "relative";
				timer.style.right = "unset";
				timer.style.top = "unset";
				timer.style.fontSize = "1.3rem";
				contextText.appendChild(timer);
			}
			let categories = create("div","categories",false,footer);
			thread.categories.forEach(category => {
				category.name = translate("$forumCategory_" + category.id,null,category.name)
			});
			if(thread.mediaCategories.length === 0){
				if(thread.categories.length){
					let catWrap = create("span",false,false,categories);
					let category = create("a",["category","default"],thread.categories[0].name,catWrap);
					category.href = "/forum/recent?category=" + thread.categories[0].id;
					category.style.background = (categoryColours.get(thread.categories[0].id) || "rgb(78, 163, 230)") + " none repeat scroll 0% 0%";
				}
			}
			else{
				let mediaTitle = titlePicker(thread.mediaCategories[0]);
				if(mediaTitle.length > 25){
					mediaTitle = mediaTitle.replace(/(2nd|Second) Season/,"2").replace(/\((\d+)\)/g,(string,year) => year);
					let lastIndex = mediaTitle.slice(0,25).lastIndexOf(" ");
					if(lastIndex > 20){
						mediaTitle.slice(0,lastIndex);
					}
					else{
						mediaTitle = mediaTitle.slice(0,20)
					}
				}
				let catWrap;
				if(
					thread.categories.length && thread.categories[0].id !== 1 && thread.categories[0].id !== 2
					&& !(mediaTitle.length > 30 && thread.categories[0].id === 5)//give priority to showing the whole title if it's just a release discussion
				){
					catWrap = create("span",false,false,categories);
					let category = create("a",["category","default"],thread.categories[0].name,catWrap);
					category.href = "/forum/recent?category=" + thread.categories[0].id;
					category.style.background = (categoryColours.get(thread.categories[0].id) || "rgb(78, 163, 230)") + " none repeat scroll 0% 0%";
				}
				catWrap = create("span",false,false,categories);
				let mediaCategory = create("a","category",mediaTitle,catWrap);
				mediaCategory.href = "/forum/recent?media=" + thread.mediaCategories[0].id;
				mediaCategory.style.background = (thread.mediaCategories[0].type === "ANIME" ? "rgb(var(--color-blue))" : "rgb(var(--color-green))") + " none repeat scroll 0% 0%";
			}
			let info = create("div","info",false,footer);
			let viewCount = create("span",false,false,info);
			viewCount.appendChild(svgAssets2.eye.cloneNode(true));
			viewCount.appendChild(document.createTextNode(" "));
			viewCount.appendChild(create("span",false,thread.viewCount,false,"padding-left: 0px;"))
			if(thread.replyCount){
				info.appendChild(document.createTextNode(" "));
				let replyCount = create("span",false,false,info);
				replyCount.appendChild(svgAssets2.reply.cloneNode(true));
				replyCount.appendChild(document.createTextNode(" "));
				replyCount.appendChild(create("span",false,thread.replyCount,false,"padding-left: 0px;"))
			}
		})
	};
	if(useScripts.forumPreviewNumber > 0){
		const {data, errors} = await anilistAPI(
			`query{
				Page(perPage:${parseInt(useScripts.forumPreviewNumber) + 12},page:1){
					threads(sort:REPLIED_AT_DESC){
						id
						viewCount
						replyCount
						title
						repliedAt
						replyCommentId
						user{
							name
							avatar{large}
						}
						replyUser{
							name
							avatar{large}
						}
						categories{
							id
							name
						}
						mediaCategories{
							id
							type
							title{romaji native english}
						}
					}
				}
			}`
		);
		if(errors){
			return
		}
		buildPreview(data)
	}
	return
}
