mod article;
mod error;
mod session;
mod user;

use clap::Command;
use error::AppError;

fn cli() -> Command {
    Command::new("sn")
        .subcommand(user::create_user_command())
        .subcommand(session::login_command())
        .subcommand(article::get_articles_command())
}

#[tokio::main]
async fn main() -> Result<(), AppError> {
    let matches = cli().get_matches();

    match matches.subcommand() {
        Some(("user-create", sub_matches)) => {
            user::create_user(sub_matches).await
        }
        Some(("login", sub_matches)) => {
            session::create_session(sub_matches).await
        }
        Some(("articles-get", _)) => {
            article::get_articles().await
        }
        Some((&_, _)) => Ok(()),
        None => {
            println!("Invalid command");
            Ok(())
        }
    }
}
