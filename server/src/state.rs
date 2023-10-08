use sqlx::{Pool, Sqlite};

#[derive(Clone)]
pub(crate) struct AppState {
    pub(crate) pool: Pool<Sqlite>
}
