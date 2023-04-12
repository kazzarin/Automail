function addEntryScore(id,tries){
	if(!location.pathname.match(/^\/(anime|manga)/)){
		return
	}
	let existing = document.getElementById("hohEntryScore");
	if(existing){
		if(existing.dataset.mediaId === id && !tries){
			return
		}
		else{
			existing.remove()
		}
	}
	let possibleLocation = document.querySelector(".actions .list .add");
	if(possibleLocation){
		let miniHolder = create("div","#hohEntryScore",false,possibleLocation.parentNode.parentNode,"position:relative;");
		miniHolder.dataset.mediaId = id;
		let type = possibleLocation.innerText;
		if(type !== "Add to List" && type !== translate("$mediaStatus_not")){
			let updateSubInfo = function(override){
				generalAPIcall(
					"query($id:Int,$name:String){MediaList(mediaId:$id,userName:$name){score progress media{episodes chapters}}}",
					{id: id,name: whoAmI},
					function(data){
						removeChildren(miniHolder);
						let MediaList = data.data.MediaList;
						let scoreSpanContainer = create("div","hohMediaScore",false,miniHolder);
						let scoreSpan = create("span",false,false,scoreSpanContainer);
						scoreSpan.title = "Score";
						let minScore = 1;
						let maxScore = 100;
						let stepSize = 1;
						if(["POINT_10","POINT_10_DECIMAL"].includes(userObject.mediaListOptions.scoreFormat)){
							maxScore = 10
						}
						if(userObject.mediaListOptions.scoreFormat === "POINT_10_DECIMAL"){
							minScore = 0.1;
							stepSize = 0.1
						}
						if(userObject.mediaListOptions.scoreFormat === "POINT_5"){
							maxScore = 5
						}
						if(MediaList.score){
							scoreSpan.appendChild(scoreFormatter(MediaList.score,userObject.mediaListOptions.scoreFormat));
							if(useScripts.accessToken && ["POINT_100","POINT_10","POINT_10_DECIMAL","POINT_5"].includes(userObject.mediaListOptions.scoreFormat)){
								let updateScore = function(isUp){
									if(isUp){
										MediaList.score += stepSize
									}
									else{
										MediaList.score -= stepSize
									}
									if(MediaList.score >= minScore && MediaList.score <= maxScore){
										scoreSpan.lastChild.remove();
										scoreSpan.appendChild(scoreFormatter(MediaList.score,userObject.mediaListOptions.scoreFormat));
										authAPIcall(
											`mutation($id:Int,$score:Float){
												SaveMediaListEntry(mediaId:$id,score:$score){
													score
												}
											}`,
											{id: id,score: MediaList.score},
											data => {
												if(!data){
													if(isUp){
														MediaList.score -= stepSize
													}
													else{
														MediaList.score += stepSize
													}
													scoreSpanContainer.style.color = "rgb(var(--color-red))";
													scoreSpanContainer.title = "Updating score failed"
												}
											}
										);
										let blockingCache = JSON.parse(sessionStorage.getItem("hohEntryScore" + id + whoAmI));
										blockingCache.data.data.MediaList.score = MediaList.score.roundPlaces(1);
										blockingCache.time = NOW();
										sessionStorage.setItem("hohEntryScore" + id + whoAmI,JSON.stringify(blockingCache));
									}
									else if(MediaList.score < minScore){
										MediaList.score = minScore
									}
									else if(MediaList.score > maxScore){
										MediaList.score = maxScore
									}
								};
								let changeMinus = create("span","hohChangeScore","-",false,"padding:2px;position:absolute;left:-1px;top:-2.5px;");
								scoreSpanContainer.insertBefore(changeMinus,scoreSpanContainer.firstChild);
								let changePluss = create("span","hohChangeScore","+",scoreSpanContainer,"padding:2px;");
								changeMinus.onclick = function(){updateScore(false)};
								changePluss.onclick = function(){updateScore(true)};
							}
						}
						if(type !== "Completed" && type !== translate("$mediaStatus_completed")){
							let progressPlace = create("span","hohMediaScore",false,miniHolder,"right:0px;");
							progressPlace.title = "Progress";
							let progressVal = create("span",false,MediaList.progress + (MediaList.media.episodes ? "/" + MediaList.media.episodes : MediaList.media.chapters ? "/" + MediaList.media.chapters : ""),progressPlace);
							if(useScripts.accessToken){
								let changePluss = create("span","hohChangeScore","+",progressPlace,"padding:2px;position:absolute;top:-2.5px;");
								changePluss.onclick = function(){
									MediaList.progress++;
									authAPIcall(
										`mutation($id:Int,$progress:Int){
											SaveMediaListEntry(mediaId:$id,progress:$progress){
												progress
											}
										}`,
										{id: id,progress: MediaList.progress},
										data => {
											if(!data){
												MediaList.progress--;
												progressVal.innerText = MediaList.progress + (MediaList.media.episodes ? "/" + MediaList.media.episodes : MediaList.media.chapters ? "/" + MediaList.media.chapters : "");
												progressVal.style.color = "rgb(var(--color-red))";
												progressVal.title = "Updating progress failed"
											}
										}
									);
									progressVal.innerText = MediaList.progress + (MediaList.media.episodes ? "/" + MediaList.media.episodes : MediaList.media.chapters ? "/" + MediaList.media.chapters : "");
									let hohGuesses = Array.from(document.querySelectorAll(".hohGuess"));
									if(hohGuesses.length === 2){
										let oldProgress = parseInt(hohGuesses[0].innerText.match(/\d+/));
										if(MediaList.progress >= oldProgress){
											hohGuesses[1].remove()
										}
										else{
											hohGuesses[1].innerText = "[+" + (MediaList.progress - oldProgress) + "]"
										}
									}
								}
							}
						}
					},
					"hohEntryScore" + id + whoAmI,30*1000,undefined,override
				)
			};
			updateSubInfo();
			let editorOpen = false;
			//try to detect if the user has recently edited the media. If so, update the info to match
			let editorChecker = function(){
				if(document.querySelector(".list-editor-wrap")){
					editorOpen = true
				}
				else if(editorOpen){
					editorOpen = false;
					updateSubInfo(true)
				}
				setTimeout(function(){
					if(!location.pathname.match(/^\/(anime|manga)/)){
						return
					}
					editorChecker()
				},1000)
			};
			editorChecker()
		}
		else if(type === "Add to List" && (tries || 0) < 10){
			setTimeout(function(){addEntryScore(id,(tries || 0) + 1)},200);
		}
	}
	else{
		setTimeout(function(){addEntryScore(id)},200)
	}
}
