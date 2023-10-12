// use reqwest::{Client, Url};
// use rss::Channel;

// use crate::error::AppError;

// pub(crate) async fn download_feed(url: Url) -> Result<Channel, AppError> {
//     let client = Client::new();
//     let bytes = client.get(url).send().await?.bytes().await?;
//     let channel = Channel::read_from(&bytes[..])?;
//     Ok(channel)
// }

// pub(crate) async fn download_feeds() -> Result<(), AppError> {
//     // let feeds = get_active_feeds();
//     Ok(())
// }
