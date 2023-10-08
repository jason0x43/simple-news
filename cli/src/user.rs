use crate::error::AppError;
use clap::{arg, ArgMatches, Command};
use reqwest::Client;
use server::CreateUserRequest;
use std::io::{stdout, Write};

pub(crate) fn create_command() -> Command {
    Command::new("user-create")
        .about("Create a user")
        .arg(arg!(<USERNAME> "A username for the user"))
        .arg(arg!(<EMAIL> "The user's email address"))
        .arg_required_else_help(true)
}

pub(crate) async fn create(matches: &ArgMatches) -> Result<(), AppError> {
    print!("Password: ");
    stdout().flush()?;
    let password = rpassword::read_password().unwrap();
    let username = matches.get_one::<String>("USERNAME").unwrap();
    let email = matches.get_one::<String>("EMAIL").unwrap();

    let body: CreateUserRequest = CreateUserRequest {
        username: username.to_owned(),
        email: email.to_owned(),
        password,
    };

    let client = Client::new();
    let _body = client
        .post("http://localhost:3000/users")
        .body(serde_json::to_string(&body).unwrap())
        .send()
        .await?;
    Ok(())
}
