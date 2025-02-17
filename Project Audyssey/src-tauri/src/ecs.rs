use flecs_ecs::prelude::*;

#[derive(Debug, Component)]
pub struct Name(String);

// ----- IDENTIFIERS ----- //

#[derive(Debug, Component)]
pub struct User;

#[derive(Debug, Component)]
pub struct Song;

#[derive(Debug, Component)]
pub struct Artist;

#[derive(Debug, Component)]
pub struct Album;

#[derive(Debug, Component)]
pub struct SpotifyID(String);

/* // todo ----- RELATIONS -----*/

/*
Song --SavedBy-- User
Song --AddedTo-- Library
*/

// ? should this be multiple distinct components that are connected by an IsA relationship to build a hierarchy
#[derive(Debug, Component)]
pub enum AudioCollection {
    Library,
    Playlist,
    Album,
    Compilation,
    Ep,
    Single,
}

// ----- Song attributes ----- //

#[derive(Debug, Component)]
pub struct Acousticness(f32); // 0.0 - 1.0

#[derive(Debug, Component)]
pub struct Danceability(f32); // 0.0 - 1.0

#[derive(Debug, Component)]
pub struct Energy(f32); // 0.0 - 1.0

#[derive(Debug, Component)]
pub struct Valence(f32); // 0.0 - 1.0

#[derive(Debug, Component)]
pub struct Tempo(f32); // 0.0 - 1.0

#[derive(Debug, Component)]
pub struct Speechiness(f32); // 0.0 - 1.0

#[derive(Debug, Component)]
pub struct Liveness(f32); // 0.0 - 1.0

#[derive(Debug, Component)]
pub struct Instrumentalness(f32); // 0.0 - 1.0

#[derive(Debug, Component)]
pub enum Mode {
    Minor, // 0 from API
    Major, // 1 from API
}

impl TryFrom<u32> for Mode {
    type Error = (); // TODO change this to be a proper error

    fn try_from(value: u32) -> Result<Self, Self::Error> {
        match value {
            0 => Ok(Mode::Minor),
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
pub enum Key {
    None, // -1
    C, // 0
    CSharp, // 1
    D, // 2
    DSharp, // 3
    E, // 4
    F, // 5
    FSharp, // 6
    G, // 7
    GSharp, // 8
    A, // 9
    ASharp, // 10
    B, // 11
}

impl TryFrom<i32> for Key {
    type Error = (); // TODO change this to be a proper error
    
    fn try_from(value: i32) -> Result<Self, Self::Error> {
        match value {
            -1 => Ok(Key::None),
            0 => Ok(Key::C),
            1 => Ok(Key::CSharp),
            2 => Ok(Key::D),
            3 => Ok(Key::DSharp),
            4 => Ok(Key::E),
            5 => Ok(Key::F),
            6 => Ok(Key::FSharp),
            7 => Ok(Key::G),
            8 => Ok(Key::GSharp),
            9 => Ok(Key::A),
            10 => Ok(Key::ASharp),
            11 => Ok(Key::B),
            _ => Err(())
        }
    }
}

// Length of the song in milliseconds
#[derive(Debug, Component)]
pub struct Duration(u32);