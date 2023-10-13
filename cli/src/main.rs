mod article;
mod error;
mod host;
mod session;
mod user;
mod util;

use clap::Command;
use error::AppError;

fn cli() -> Command {
    Command::new("sn")
        .subcommand(user::create_user_command())
        .subcommand(user::list_users_command())
        .subcommand(session::login_command())
        .subcommand(session::logout_command())
        .subcommand(article::get_articles_command())
        .subcommand(host::set_host_command())
        .subcommand(host::show_host_command())
}

#[tokio::main]
async fn main() -> Result<(), AppError> {
    let matches = cli().get_matches();

    match matches.subcommand() {
        Some(("user-create", sub_matches)) => {
            user::create_user(sub_matches).await
        }
        Some(("user-list", _)) => {
            user::list_users().await
        }
        Some(("login", sub_matches)) => {
            session::create_session(sub_matches).await
        }
        Some(("logout", _)) => {
            session::clear_session().await
        }
        Some(("articles-get", _)) => {
            article::get_articles().await
        }
        Some(("host-set", sub_matches)) => {
            host::set_host(sub_matches).await
        }
        Some(("host-show", _)) => {
            host::show_host().await
        }
        Some((&_, _)) => Ok(()),
        None => {
            println!("Invalid command");
            Ok(())
        }
    }
}
