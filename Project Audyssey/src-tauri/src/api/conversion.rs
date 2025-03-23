use std::{fs::{File, OpenOptions}, io::{BufReader, BufWriter}, path::PathBuf};

use flecs_ecs::{core::World, prelude::{Builder, QueryAPI, QueryBuilderImpl}};
use serde::{Serialize, Deserialize};
use tauri::State;

use crate::{
    ecs::types::{
        Acousticness, AddedAt, Album, Artist, Current, Danceability, Duration, Energy, Explicit, Genres, Instrumentalness, Key, Liveness, Loudness, MissingAttributes, Mode, Name, Popularity, Song, Speechiness, SpotifyID, Tempo, TimeSignature, Valence
    }, error::{MyError, MyResult}, AppState
};

use super::{
    soundcharts::{self, SCGenreObject},
    spotify::{
        AlbumObject, ImageObject, SavedTrackObject, SimplifiedArtistObject
    }
};

#[tauri::command]
pub async fn serialize_ecs_to_file(
    state: State<'_, AppState>,
) -> MyResult<String> {
    let locked_state = state.lock().await;
    let file_path = &locked_state.main_directory;
    let world = &locked_state.ecs_world;

    minimal_tracks_to_file(file_path, ecs_to_minimal_objects(world)?)
}

#[tauri::command]
pub async fn file_to_ecs_cmd(
    state: State<'_, AppState>,
) -> MyResult<String> {
    let locked_state = state.lock().await;
    let file_path = &locked_state.main_directory;
    let world = &locked_state.ecs_world;

    if let Ok(minimal_tracks) = file_to_minimal_objects(file_path) {
        let _a = minimal_tracks_to_ecs(minimal_tracks, world, false);
        
        Ok(String::from("Converted songs from file to ecs"))
    } else {
        Err(MyError::ConversionError {
            r#source: "File of MinimalTrackObject structs".to_string(),
            target: "Entity Component System".to_string()
        })
    }
}

pub fn file_to_minimal_objects(
    file_path: &PathBuf
) -> MyResult<Vec<MinimalTrackObject>> {
    let file = File::open(file_path).expect("Couldn't open file");
    let reader = BufReader::new(file);

    Ok(serde_json::from_reader::<_, Vec<MinimalTrackObject>>(reader)?)
}

pub fn minimal_tracks_to_ecs(
    minimal_tracks: Vec<MinimalTrackObject>,
    world: &World,
    current: bool
) {
    //let artist_parent = world.entity_named("Artist");
    //let created_rel = world.entity_named("Created");
    //let has_rel = world.entity_named("Has");

    for song in minimal_tracks {
        let song_ent = world.entity()
            .add::<Song>()
            .set(Name(song.name))
            .set(AddedAt(song.timestamp))
            .set(SpotifyID(song.spotify_id))
            .set(Duration(song.duration_ms))
            .set(Explicit(song.explicit))
            .set(Popularity(song.popularity))
            // todo .set the playlists the song belongs to
            .set(Artist(song.artists))
            .set(Album(song.album))
        ;
        if current { song_ent.add::<Current>(); }

        // ! below was commented out as it cause a stack overflow
        /*------- Artist Entity -------
        for artist in song.artists {
            let _artist_ent = world
                .entity_named(format!("Artist::{}", artist.name).as_str())
                .child_of_id(artist_parent)
                .set(Name(artist.name))
                .set(SpotifyID(artist.spotify_id))
                .add_id((created_rel, song_ent))
            ;
        }

        //*------- Album Entity -------*/
        // Might not work due to albums having the same name
        // They should have a unique SpotifyID though, so that is used as their name instead
        let alb_ent = world
            .entity_named(format!("Album::{}", song.album.spotify_id).as_str()) // Creates new entity or returns the entity with the name if it already exists
            .set(Name(song.album.name))
            .set(AudioCollection::Album {
                alb_type: song.album.album_type,
                release_date: song.album.release_date,
                rel_date_precision: song.album.release_date_precision,
                images: song.album.images,
            })
            .set(SpotifyID(song.album.spotify_id))
            .add_id((has_rel, song_ent))
        ; 

        for alb_artist in song.album.artists {
            let _alb_artist_ent = world
                .entity_named(format!("Artist::{}", alb_artist.name).as_str())
                .child_of_id(artist_parent)
                .set(Name(alb_artist.name))
                .set(SpotifyID(alb_artist.spotify_id))
                .add_id((created_rel, alb_ent))
            ;
        } */

        match song.attributes {
            None => song_ent
                .add::<MissingAttributes>(),
            Some(attrs) => song_ent
                .set(Acousticness(attrs.acousticness))
                .set(Danceability(attrs.danceability))
                .set(Energy(attrs.energy))
                .set(Valence(attrs.valence))
                .set(Tempo(attrs.tempo))
                .set(Speechiness(attrs.speechiness))
                .set(Liveness(attrs.liveness))
                .set(Loudness(attrs.loudness))
                .set(Instrumentalness(attrs.instrumentalness))
                .set(Mode::try_from(attrs.mode).expect("Mode is not 0 or 1"))
                .set(TimeSignature(attrs.time_signature))
                .set(Key::try_from(attrs.key).expect("Key is not in range 3..7"))
                .set(Genres(attrs.genres)) // ? do we need a better data structure for the genres of a song
        };

        song_ent.get::<&Name>(|name| println!("Created song entity for song: {}", name.0));
    };
}

pub fn ecs_to_minimal_objects(
    world: &World
) -> MyResult<Vec<MinimalTrackObject>>{
    let mut minimal_tracks: Vec<MinimalTrackObject> = vec![];
    
    let q = world.query::<(
        &Name, &AddedAt, &SpotifyID, &Duration, &Explicit,
        &Popularity, &Artist, &Album
    )>().with::<&Song>().build();

    q.each_entity(|e, (
        name, added_at, s_id, dur, exp,
        pop, art, alb
    )| {
        // * can get around query limit by doing entity.get
        let mut song: MinimalTrackObject = MinimalTrackObject {
            name: (*name.0).to_string(), // this is the same as doing .clone()
            timestamp: added_at.0.clone(),
            duration_ms: dur.0,
            explicit: exp.0,
            spotify_id: s_id.0.clone(),
            popularity: pop.0,
            attributes: None,
            artists: art.0.clone(),
            album: alb.0.clone(),
            disc_number: 0,
            track_number: 0,
        };

        e.get::<(
            &Acousticness, &Danceability, &Energy, &Valence, &Tempo,
            &Speechiness, &Liveness, &Loudness, &Instrumentalness,
            &Mode, &TimeSignature, &Key, &Genres
        )>(|(
            ac, dan, energy, val, tempo,
            speech, live, loud, instr,
            mode, time_s, key, g
        )| {
            song.attributes = Some(Attributes {
                acousticness: ac.0,
                danceability: dan.0,
                energy: energy.0,
                valence: val.0,
                tempo: tempo.0,
                speechiness: speech.0,
                liveness: live.0,
                loudness: loud.0,
                instrumentalness: instr.0,
                mode: u32::from(*mode),
                time_signature: time_s.0,
                key: i32::from(*key),
                genres: g.0.clone(),
            })

        });

        minimal_tracks.push(song);
    });

    Ok(minimal_tracks)
}

pub fn minimal_tracks_to_file(
    file_path: &PathBuf,
    songs: Vec<MinimalTrackObject>
) -> MyResult<String> {//* Needs to be run before the application closes */
    println!("Beginning writing of MinimalTrackObjects to file system");

    let file = OpenOptions::new().write(true).truncate(true).open(file_path).expect("Couldn't open file to overwrite contents");
    let writer = BufWriter::new(file);

    serde_json::to_writer_pretty(writer, &songs).expect("Failed to serialize songs to file");

    Ok(String::from("MinimalObjects serialized to file successfully"))
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct Attributes {
    pub acousticness: f32,
    pub danceability: f32,
    pub energy: f32,
    pub valence: f32,
    pub tempo: f32,
    pub speechiness: f32,
    pub liveness: f32,
    pub loudness: f32,
    pub instrumentalness: f32,
    pub mode: u32,
    pub time_signature: u32,
    pub key: i32,
    pub genres: Vec<SCGenreObject>
}
impl From<soundcharts::SongObject> for Attributes {
    fn from(sc: soundcharts::SongObject) -> Self {
        Self {
            acousticness: sc.audio.acousticness,
            danceability: sc.audio.danceability,
            energy: sc.audio.energy,
            valence: sc.audio.valence,
            tempo: sc.audio.tempo,
            speechiness: sc.audio.speechiness,
            liveness: sc.audio.liveness,
            loudness: sc.audio.loudness,
            instrumentalness: sc.audio.instrumentalness,
            mode: sc.audio.mode,
            time_signature: sc.audio.timeSignature,
            key: sc.audio.key,
            genres: sc.genres,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct MinimalTrackObject {
    pub name: String,
    // Timestamp is returned in ISO 8601 format as Coordinated Universal Time (UTC) with a zero offset
    // YYYY-MM-DDTHH:MM:SSZ
    pub timestamp: String,
    pub duration_ms: u32, // in milliseconds
    pub explicit: bool,
    pub spotify_id: String,
    pub popularity: u16,
    //* Disc and track number may be redundant */
    disc_number: u16,
    track_number: u16,
    pub album: MinimalAlbumObject,
    pub artists: Vec<MinimalArtistObject>,
    pub attributes: Option<Attributes>
}
impl From<SavedTrackObject> for MinimalTrackObject {
    fn from(s_t_obj: SavedTrackObject) -> Self {
        let t = s_t_obj.track;
        Self {
            timestamp: s_t_obj.added_at,
            duration_ms: t.duration_ms,
            explicit: t.explicit,
            spotify_id: t.id,
            name: t.name,
            popularity: t.popularity,
            disc_number: t.disc_number,
            track_number: t.track_number,
            album: MinimalAlbumObject::from(t.album),
            artists: t.artists.into_iter().map(|a| MinimalArtistObject::from(a)).collect(),
            attributes: None
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct MinimalAlbumObject {
    pub album_type: AlbumType,
    pub total_tracks: u16,
    pub spotify_id: String,
    pub images: Vec<ImageObject>,
    pub name: String,
    pub release_date: String, // E.g "1981-12"
    pub release_date_precision: ReleaseDatePrecision,
    pub artists: Vec<MinimalArtistObject>
}
impl From<AlbumObject> for MinimalAlbumObject {
    fn from(alb_obj: AlbumObject) -> Self {
        Self {
            album_type: match alb_obj.album_type.as_str() {
                "album" => AlbumType::Album,
                "single" => AlbumType::Single,
                "compilation" => AlbumType::Compilation,
                _ => panic!("Album_type is unrecognised value")
            },
            total_tracks: alb_obj.total_tracks,
            spotify_id: alb_obj.id,
            images: alb_obj.images,
            name: alb_obj.name,
            release_date: alb_obj.release_date,
            release_date_precision: match alb_obj.release_date_precision.as_str() {
                "year" => ReleaseDatePrecision::Year,
                "month" => ReleaseDatePrecision::Month,
                "day" => ReleaseDatePrecision::Day,
                _ => panic!("Release_date_precision is unrecognised value")
            },
            artists: alb_obj.artists.into_iter().map(|a| MinimalArtistObject::from(a)).collect(),
        }
        
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum AlbumType {
    Album,
    Single,
    Compilation
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum ReleaseDatePrecision {
    Year,
    Month,
    Day
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct MinimalArtistObject {
    pub href: String,
    pub spotify_id: String,
    pub name: String,
}
impl From<SimplifiedArtistObject> for MinimalArtistObject {
    fn from(art_obj: SimplifiedArtistObject) -> Self {
        Self { href: art_obj.href, spotify_id: art_obj.id, name: art_obj.name }
    }
}