use std::collections::HashMap;

use tsync::tsync;

#[tsync]
#[allow(dead_code)]
type Uuid = String;

#[tsync]
#[allow(dead_code)]
type Url = String;

#[tsync]
#[allow(dead_code)]
#[allow(non_camel_case_types)]
type Value<unknown> = HashMap<String, unknown>;
