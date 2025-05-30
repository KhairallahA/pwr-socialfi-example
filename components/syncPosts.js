import { vidaId } from "@/app/page";
import PWRJS from "@pwrjs/core";

// Sync posts and likes from the blockchain
export async function syncPosts(setPosts) {
    const rpc = new PWRJS("https://pwrrpc.pwrlabs.io/");
	const startingBlock = BigInt(await rpc.getLatestBlockNumber());

    // Handler function that processes incoming blockchain transactions
    // It parses transaction data and updates the posts state accordingly
    // - For post transactions: adds new posts if they don't already exist
    // - For like transactions: increments like count if user hasn't liked before
    function handlerTransactions(transaction) {
		let dataHex = transaction.data;
		const data = Buffer.from(dataHex, 'hex');
		const postData = JSON.parse(data.toString('utf8'));

		if (postData.type.toLowerCase() === "post" && postData.id != null) {
			// Add new post if it doesn't exist
			setPosts(prev => {
				const exists = prev.some(p => p.id === postData.id);
				if (exists) return prev;
				return [
					...prev,
					{
						...postData,
						likes: 0,
						likedBy: []
					}
				];
			});
		} else if (postData.type.toLowerCase() === "like") {
			setPosts(prev =>
				prev.map(post => {
					if (post.id === postData.postId) {
						// Only increment if this sender hasn't liked before
						if (!post.likedBy?.includes(postData.sender)) {
							return {
								...post,
								likes: post.likes + 1,
								likedBy: [...(post.likedBy || []), postData.sender]
							};
						}
					}
					return post;
				})
			);
		}
	}

    // Subscribe to vidaId transactions
    rpc.subscribeToVidaTransactions(vidaId, startingBlock, handlerTransactions);
}