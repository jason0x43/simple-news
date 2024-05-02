use sqlx::{Pool, Postgres};

#[derive(Clone)]
pub(crate) struct AppState {
    pub(crate) pool: Pool<Postgres>
}
