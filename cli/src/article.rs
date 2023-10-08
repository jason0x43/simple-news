use clap::Command;
use reqwest::Client;

use crate::error::AppError;

pub(crate) fn get_articles_command() -> Command {
    Command::new("articles-get").about("Get the list of articles")
}

pub(crate) async fn get_articles() -> Result<(), AppError> {
    let client = Client::new();
    let body = client.get("http://localhost:3000/articles").send().await?;
    print!("{}", body.text().await?);
    Ok(())
}
