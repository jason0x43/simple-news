use crate::{error::AppError, util::get_client};
use clap::{arg, ArgMatches, Command};
use serde_json::to_string_pretty;
use server::{CreateUserRequest, User};
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

    let body = CreateUserRequest {
        username: username.to_owned(),
        email: email.to_owned(),
        password,
    };

    let client = get_client()?;
    let _body = client
        .post("http://localhost:3000/users")
        .json(&body)
        .send()
        .await?;

    Ok(())
}

pub(crate) fn list_command() -> Command {
    Command::new("user-list")
        .about("List users")
        .arg_required_else_help(false)
}

pub(crate) async fn list() -> Result<(), AppError> {
    let client = get_client()?;
    let body = client.get("http://localhost:3000/users").send().await?;
    let users: Vec<User> = body.json().await?;

    println!("{}", to_string_pretty(&users).unwrap());

    Ok(())
}
