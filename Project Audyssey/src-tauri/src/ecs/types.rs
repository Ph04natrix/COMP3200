use flecs_ecs::prelude::*;

use crate::api::{conversion::{AlbumType, ReleaseDatePrecision}, soundcharts::SCGenreObject, spotify::{self, ImageObject}};

#[derive(Debug, Component)]
pub struct Name(pub String);

#[derive(Debug, Component)]
pub struct AddedAt(pub String); //todo "Convert from Utc string to data structure"

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
pub struct SpotifyID(pub String);

#[derive(Debug, Component)]
pub struct Current;

#[derive(Debug, Component)]
pub struct MissingAttributes;

//*------- RELATIONS -------*/

/*
Song --AddedTo-- AudioCollection::Library
Artist --Created-- Song
Song
*/

// ? should this be multiple distinct components that are connected by an IsA relationship to build a hierarchy
#[derive(Debug, Component)]
pub enum AudioCollection {
    Library,
    Playlist,
    Album {
        alb_type: AlbumType,
        release_date: String,
        rel_date_precision: ReleaseDatePrecision,
        images: Vec<ImageObject>
    },
}

// ----- Song attributes ----- //

#[derive(Debug, Component)]
pub struct Acousticness(pub f32); // 0.0 - 1.0

#[derive(Debug, Component)]
pub struct Danceability(pub f32); // 0.0 - 1.0

#[derive(Debug, Component)]
pub struct Energy(pub f32); // 0.0 - 1.0

#[derive(Debug, Component)]
pub struct Valence(pub f32); // 0.0 - 1.0

#[derive(Debug, Component)]
pub struct Tempo(pub f32); // 

#[derive(Debug, Component)]
pub struct Speechiness(pub f32); // 0.0 - 1.0

#[derive(Debug, Component)]
pub struct Liveness(pub f32); // 0.0 - 1.0

#[derive(Debug, Component)]
pub struct Loudness(pub f32); // -60..0 dB

#[derive(Debug, Component)]
pub struct Instrumentalness(pub f32); // 0.0 - 1.0

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
pub struct Explicit(pub bool);

#[derive(Debug, Component)]
pub struct TimeSignature(pub u32); // 3, 4, 5, 6, 7

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
pub struct Duration(pub u32);

#[derive(Debug, Component)]
pub struct Popularity(pub u16);

#[derive(Debug, Component)]
pub struct Genres(pub Vec<SCGenreObject>);

//*------- End of Component Definitions -------*/

#[derive(Debug, Component)]
pub struct AudysseyModule;

impl Module for AudysseyModule {
    fn module(world: &World) {
        let custom_pipeline = world
            .pipeline_named("name");

        world
            .system_named::<(&Song, &Name, &Duration)>("Get Duration")
            .each(|(_s, name, dur)| {
                // println!("{} has duration={}",name.0, dur.0);

            });

        //*-------Component Registration-------*/
        world.component::<Name>();
        world.component::<User>();
        world.component::<Song>();
        world.component::<Artist>();
        world.component::<Album>();
        world.component::<SpotifyID>();
        world.component::<Current>();

        world.component::<AudioCollection>();

        world.component::<MissingAttributes>();
        world.component::<Acousticness>();
        world.component::<Danceability>();
        world.component::<Energy>();
        world.component::<Valence>();
        world.component::<Tempo>();
        world.component::<Speechiness>();
        world.component::<Liveness>();
        world.component::<Loudness>();
        world.component::<Instrumentalness>();
        world.component::<Mode>();
        world.component::<Explicit>();
        world.component::<TimeSignature>();
        world.component::<Key>();
        world.component::<Duration>();

        world.component::<Genres>();
        world.component::<Popularity>();
    }
}