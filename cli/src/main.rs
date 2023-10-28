mod article;
mod error;
mod feed;
mod host;
mod session;
mod user;
mod util;

use clap::Command;
use colored::Colorize;

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
async fn main() {
    let matches = cli().get_matches();

    let result = match matches.subcommand() {
        Some(("user", matches)) => user::handle(matches).await,
        Some(("session", matches)) => session::handle(matches).await,
        Some(("article", matches)) => article::handle(matches).await,
        Some(("host", matches)) => host::handle(matches).await,
        Some(("feed", matches)) => feed::handle(matches).await,
        _ => unreachable!(),
    };

    if let Err(result) = result {
        let heading = "ERROR".red().bold();
        eprintln!("{}: {}", heading, result);
    }
}
