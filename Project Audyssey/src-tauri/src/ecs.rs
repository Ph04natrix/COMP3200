use flecs_ecs::prelude::*;

#[derive(Debug, Component)]
pub struct Name(String);

// ----- IDENTIFIERS ----- //

#[derive(Debug, Component)]
pub struct Song;

#[derive(Debug, Component)]
pub struct Artist;

#[derive(Debug, Component)]
pub struct Album;

// ----- Song attributes ----- //

#[derive(Debug, Component)]
pub struct Acousticness(f32); // 0.0 - 1.0

#[derive(Debug, Component)]
pub struct Danceability(f32);

#[derive(Debug, Component)]
pub struct Energy(f32);

#[derive(Debug, Component)]
pub struct Valence(f32);

#[derive(Debug, Component)]
pub struct Tempo(f32);

#[derive(Debug, Component)]
pub struct Speechiness(f32);

#[derive(Debug, Component)]
pub struct Liveness(f32);

#[derive(Debug, Component)]
pub struct Instrumentalness(f32);

#[derive(Debug, Component)]
pub enum Mode {
    Minor, // 0 from API
    Major, // 1 from API
}

impl TryFrom<u32> for Mode {
    type Error = (); // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    fn try_from(value: u32) -> Result<Self, Self::Error> {
        match value {
            0 => Ok((Mode::Minor)),
            1 => Ok(Mode::Major),
            _ => Err(())
        }
    }
}

#[derive(Debug, Component)]
pub struct Explicit(bool);

#[derive(Debug, Component)]
pub struct TimeSignature(u32); // 3, 4, 5, 6, 7

#[derive(Debug, Component)]
pub struct Key(i32);

#[derive(Debug, Component)]
pub struct Duration(u32);