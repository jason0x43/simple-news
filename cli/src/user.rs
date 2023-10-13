use crate::error::AppError;
use clap::{arg, ArgMatches, Command};
use reqwest::Client;
use serde_json::to_string_pretty;
use server::{CreateUserRequest, User};
use std::io::{stdout, Write};

pub(crate) fn create_user_command() -> Command {
    Command::new("user-create")
        .about("Create a user")
        .arg(arg!(<USERNAME> "A username for the user"))
        .arg(arg!(<EMAIL> "The user's email address"))
        .arg_required_else_help(true)
}

pub(crate) async fn create_user(matches: &ArgMatches) -> Result<(), AppError> {
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

    let client = Client::new();
    let _body = client
        .post("http://localhost:3000/users")
        .json(&body)
        .send()
        .await?;

    Ok(())
}

pub(crate) fn list_users_command() -> Command {
    Command::new("user-list")
        .about("List users")
        .arg_required_else_help(false)
}

pub(crate) async fn list_users() -> Result<(), AppError> {
    let client = Client::new();
    let body = client.get("http://localhost:3000/users").send().await?;
    let users: Vec<User> = body.json().await?;

    println!("{}", to_string_pretty(&users).unwrap());

    Ok(())
}
