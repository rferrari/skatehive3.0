import HiveClient from "@/lib/hive/hiveclient";
import { Discussion } from "@hiveio/dhive";

export async function fetchComments(
    author: string,
    permlink: string,
    recursive: boolean = false
): Promise<Discussion[]> {
    try {
        const comments = (await HiveClient.database.call("get_content_replies", [
            author,
            permlink,
        ])) as Discussion[];

        if (recursive) {
            const fetchReplies = async (Discussion: Discussion): Promise<Discussion> => {
                if (Discussion.children && Discussion.children > 0) {
                    Discussion.replies = await fetchComments(Discussion.author, Discussion.permlink, true) as any;
                }
                return Discussion;
            };
            const commentsWithReplies = await Promise.all(comments.map(fetchReplies));
            return commentsWithReplies;
        } else {
            return comments;
        }
    } catch (error) {
        console.error("Failed to fetch comments:", error);
        return [];
    }
} 