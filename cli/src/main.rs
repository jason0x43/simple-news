mod article;
mod error;
mod feed;
mod host;
mod session;
mod user;
mod util;

use clap::Command;
use error::AppError;

fn cli() -> Command {
    Command::new("sn")
        .subcommand(user::create_command())
        .subcommand(user::list_command())
        .subcommand(session::login_command())
        .subcommand(session::logout_command())
        .subcommand(article::list_command())
        .subcommand(host::set_command())
        .subcommand(host::show_command())
        .subcommand(feed::add_command())
        .subcommand(feed::list_command())
}

#[tokio::main]
async fn main() -> Result<(), AppError> {
    let matches = cli().get_matches();

    match matches.subcommand() {
        Some(("user-create", sub_matches)) => {
            user::create(sub_matches).await
        }
        Some(("user-list", _)) => {
            user::list().await
        }
        Some(("login", sub_matches)) => {
            session::create(sub_matches).await
        }
        Some(("logout", _)) => {
            session::clear().await
        }
        Some(("articles-get", _)) => {
            article::list().await
        }
        Some(("host-set", sub_matches)) => {
            host::set(sub_matches).await
        }
        Some(("host-show", _)) => {
            host::show().await
        }
        Some(("feed-add", sub_matches)) => {
            feed::add(sub_matches).await
        }
        Some(("feed-list", _)) => {
            feed::list().await
        }
        Some((&_, _)) => Ok(()),
        None => {
            println!("Invalid command");
            Ok(())
        }
    }
}
