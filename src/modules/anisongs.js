//fork of anisongs by morimasa
//https://greasyfork.org/en/scripts/374785-anisongs
const anisongs_temp = {
	last: null,
	target: null
}

exportModule({
	id: "anisongs",
	description: "$anisongs_description",
	isDefault: true,
	categories: ["Media"],
	visible: true,
	urlMatch: function(url){
    return /^https:\/\/anilist\.co\/(anime|manga)\/[0-9]+\/.*/.test(url)
	},
	code: function(){
const options = {
  cacheTTL: 604800000, // 1 week in ms
  class: 'anisongs', // container class
}

const songCache = localforage.createInstance({name: script_type.toLowerCase(), storeName: "anisongs"});

const API = {
  async getSongs(mal_id) {
    const res = await fetch(`https://api.jikan.moe/v4/anime/${mal_id}/themes`)
    return res.json()
  },
  async getVideos(anilist_id) {
    const res = await fetch(`https://api.animethemes.moe/anime?filter[has]=resources&filter[site]=AniList&filter[external_id]=${anilist_id}&include=animethemes.animethemeentries.videos`)
    return res.json()
  }
}

class VideoElement {
  constructor(parent, url) {
    this.url = url
    this.parent = parent
    this.make()
  }

  toggle() {
    if (this.el.parentNode) {
      this.el.remove()
    }
    else {
      this.parent.append(this.el)
      this.el.children[0].autoplay = true // autoplay
    }
  }

  make() {
    const box = document.createElement('div'),
          vid = document.createElement('video')
    vid.src = this.url
    vid.controls = true
    vid.preload = "none"
    vid.volume = 0.4
    box.append(vid)
    this.el = box
  }
}

class Videos {
  constructor(id) {
    this.id = id
  }

  async get() {
    const {anime} = await API.getVideos(this.id);
    if(anime.length === 0){
      return {"OP":[], "ED":[]}
    }
    return Videos.groupTypes(anime[0].animethemes)
  }

  static groupTypes(songs) {
    const groupBy = (xs, key) => {
      return xs.reduce(function(rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
      }, {});
    };
    return groupBy(songs, "type")
  }

  static merge(entries, videos) {
    const cleanTitle = song => {
      return song.replace(/^\d{1,2}:/, "")
    }
    const findUrl = n => {
      let url;
      if(videos[n]) {
        if(videos[n].animethemeentries[0] && videos[n].animethemeentries[0].videos[0]){
          url = videos[n].animethemeentries[0].videos[0].link
        }
        if(url) url = url.replace(/staging\./, "")
      }
      return url
    }
    if(videos) {
      return entries.map((e, i) => {
        return {
          title: cleanTitle(e),
          url: findUrl(i)
        }
      })
    }
    return entries.map((e) => {
      return {
        title: cleanTitle(e)
      }
    })
  }
}

function insert(songs, parent) {
  if (!songs || !songs.length) {
    create("div",false,translate("$anisongs_noSongs") + " (つ﹏<)･ﾟ｡",parent,"text-align:center");
  }
  else {
    songs.forEach( (song, i) => {
      const txt = `${i+1}. ${song.title || song}`;
      const node = create("div","anisong-entry",txt,parent);
      if (song.url) {
        const vid = new VideoElement(node, song.url)
        node.addEventListener("click", () => vid.toggle())
        node.classList.add("has-video")
      }
    })
  }
}

function createTargetDiv(text, target, pos) {
  let el = document.createElement('div');
  el.appendChild(document.createElement('h2'));
  el.children[0].innerText = text;
  el.classList = options.class;
  target.insertBefore(el, target.children[pos]);
  return el;
}

function cleaner(target) {
  if (!target) return;
  let el = target.querySelectorAll(`.${options.class}`);
  el.forEach(e => target.removeChild(e))
}

function placeData(data) {
  cleaner(anisongs_temp.target);
  let op = createTargetDiv(translate("$anisongs_openings"), anisongs_temp.target, 0);
  if(data.opening_themes.length === 1){
    op.children[0].innerText = translate("$anisongs_opening")
  }
  let ed = createTargetDiv(translate("$anisongs_endings"), anisongs_temp.target, 1);
  if(data.ending_themes.length === 1){
    ed.children[0].innerText = translate("$anisongs_ending")
  }
  insert(data.opening_themes, op);
  insert(data.ending_themes, ed);
}

async function launch(currentid) {
  // get from cache and check TTL
  const cache = await songCache.getItem(currentid) || {time: 0};
  if(
    (cache.time + options.cacheTTL)
    < +new Date()
  ) {
    const {data, errors} = await anilistAPI("query($id:Int){Media(id:$id){idMal status}}", {
      variables: {id: currentid}
    });
    if(errors){
      return "AniList API failure"
    }
    const {idMal: mal_id, status} = data.Media;
    if (mal_id) {
      const {data} = await API.getSongs(mal_id);
      let {openings: opening_themes, endings: ending_themes} = data;
      // add songs to cache if they're not empty and query videos
      if (opening_themes.length || ending_themes.length) {
        if (["FINISHED", "RELEASING"].includes(status)) {
          try {
            const _videos = await new Videos(currentid).get()
            opening_themes = Videos.merge(opening_themes, _videos.OP)
            ending_themes = Videos.merge(ending_themes, _videos.ED)
          }
          catch(e){console.log("Anisongs", e)} // 🐟
        }
        await songCache.setItem(currentid, {opening_themes, ending_themes, time: +new Date()});
      }
      // place the data onto site
      placeData({opening_themes, ending_themes});
      return "Downloaded songs"
    }
    else {
      return "No malid"
    }
  }
  else {
    // place the data onto site
    placeData(cache);
    return "Used cache"
  }
}

let currentpath = location.pathname.match(/(anime|manga)\/([0-9]+)\/[^/]*\/?(.*)/)
if(currentpath[1] === "anime") {
	let currentid = currentpath[2];
	let location = currentpath[3];
	if(location !== ""){
		anisongs_temp.last = 0
	}
	anisongs_temp.target = document.querySelectorAll(".grid-section-wrap")[2];
	if(anisongs_temp.last !== currentid && location === ""){
		if(anisongs_temp.target){
			anisongs_temp.last = currentid;
			launch(currentid)
		}
		else{
			setTimeout(()=>{this.code.call(this)},500)
		}
	}
}
else if(currentpath[1] === "manga"){
	cleaner(anisongs_temp.target);
	anisongs_temp.last = 0
}
else{
	anisongs_temp.last = 0
}
	}
})
