import * as _ from "lodash";
import axios from "axios";
import * as cheerio from "cheerio";

const getSubredditUrl = (searchTerm: string, limit: number) => `https://www.reddit.com/r/BehindTheTables/search.json?q=${searchTerm}&restrict_sr=on&&sort=relevance&t=all&limit=${limit}`;

async function getPosts(searchTerm: string): Promise<any [] | undefined> {
    try {
        const subredditUrl = getSubredditUrl(searchTerm, 1);
        const response = await axios.get(subredditUrl);
        const selfPostHtmlContents: string [] = response.data.data
            .children
            .filter((c: any) => c.kind == "t3" && c.data && c.data.selftext_html)
            .map((c: any) => c.data);
        return selfPostHtmlContents;
    } catch (error) {
        console.error(error);
    }
}

export async function GetRandomEntryFromRedditTable(searchTerm: string) {
    const posts = await getPosts(searchTerm);
    if(posts === undefined) {
        return "";
    }
    const firstPost = posts[0];
    if(firstPost === undefined) {
        return "";
    }
    const $ = cheerio.load(_.unescape(firstPost.selftext_html));
    const entries = $("li");
    const randomIndex = _.random(entries.length);
    const randomEntry = entries[randomIndex].children[0].data;
    if(randomEntry === undefined) {
        return "";
    }
    return randomEntry;
}

const searchArgument = process.argv[2];
if(searchArgument !== undefined){
    GetRandomEntryFromRedditTable(searchArgument).then(c => console.log(c));
}
