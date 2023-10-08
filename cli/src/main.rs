mod error;
mod user;

use clap::Command;
use error::AppError;

fn cli() -> Command {
    Command::new("sn").subcommand(user::create_command())
}

#[tokio::main]
async fn main() -> Result<(), AppError> {
    let matches = cli().get_matches();

    match matches.subcommand() {
        Some(("user-create", sub_matches)) => user::create(sub_matches).await,
        Some((&_, _)) => Ok(()),
        None => {
            println!("Invalid command");
            Ok(())
        }
    }
}
