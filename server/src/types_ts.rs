use std::collections::HashMap;

use tsync::tsync;

#[tsync]
#[allow(dead_code)]
type Url = String;

#[tsync]
#[allow(non_camel_case_types)]
#[allow(dead_code)]
type Value<unknown> = HashMap<String, unknown>;

#[tsync]
#[allow(dead_code)]
type UserId = String;

#[tsync]
#[allow(dead_code)]
type FeedId = String;

#[tsync]
#[allow(dead_code)]
type FeedGroupId = String;

#[tsync]
#[allow(dead_code)]
type SessionId = String;

#[tsync]
#[allow(dead_code)]
type ArticleId = String;

#[tsync]
#[allow(dead_code)]
type OffsetDateTime = String;
