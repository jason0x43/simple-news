use std::collections::HashMap;

use tsync::tsync;

#[tsync]
#[allow(dead_code)]
type Uuid = String;

#[tsync]
#[allow(dead_code)]
type Url = String;

#[tsync]
#[allow(non_camel_case_types)]
#[allow(dead_code)]
type Value<unknown> = HashMap<String, unknown>;

#[tsync]
#[allow(dead_code)]
type UserId = Uuid;

#[tsync]
#[allow(dead_code)]
type FeedId = Uuid;

#[tsync]
#[allow(dead_code)]
type SessionId = Uuid;

#[tsync]
#[allow(dead_code)]
type ArticleId = Uuid;

#[tsync]
#[allow(dead_code)]
type OffsetDateTime = String;
