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
        .subcommand(user::command())
        .subcommand(session::command())
        .subcommand(article::command())
        .subcommand(host::command())
        .subcommand(feed::command())
        .arg_required_else_help(true)
}

#[tokio::main]
async fn main() -> Result<(), AppError> {
    let matches = cli().get_matches();

    match matches.subcommand() {
        Some(("user", matches)) => user::handle(matches).await,
        Some(("session", matches)) => session::handle(matches).await,
        Some(("article", matches)) => article::handle(matches).await,
        Some(("host", matches)) => host::handle(matches).await,
        Some(("feed", matches)) => feed::handle(matches).await,
        _ => unreachable!(),
    }
}
