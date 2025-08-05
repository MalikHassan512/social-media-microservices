


export const handlePostDeleted = async (event) => {
    try {
        const { postId } = event;
        logger.info(`Handling post deleted event for post ID: ${postId}`);
        
        // Logic to handle the post deletion, e.g., remove media associated with the post
        // This could involve deleting files from storage or updating the database
        
    } catch (error) {
        logger.error('Error handling post deleted event:', error);
    }
}