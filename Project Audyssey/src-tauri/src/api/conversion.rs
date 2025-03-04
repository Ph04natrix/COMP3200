use std::{fs::File, io::BufWriter, path::PathBuf};

use serde::{Serialize, Deserialize};

use super::{soundcharts::{self, get_song_audio_attributes, SCGenreObject}, spotify::{AlbumObject, ImageObject, SavedTrackObject, SavedTracksObject, SimplifiedArtistObject, SpotifyID}};

pub async fn write_api_songs_to_file(
    songs: Vec<SavedTracksObject>,
    app_dir_path: PathBuf
) {
    let mut trimmed_spotify_songs: Vec<MinimalTrackObject> = Vec::new();
    
    for saved_tracks_obj in songs {
        for track_obj in saved_tracks_obj.items {
            let trimmed_track: MinimalTrackObject = track_obj.into();
            println!("Stripped down song: {}", &trimmed_track.name);
            trimmed_spotify_songs.push(trimmed_track);
        }
    }

    let updated_songs = get_song_audio_attributes(trimmed_spotify_songs, 1).await.expect("Couldn't add SoundCharts attributes to tracks");

    let file = File::create(app_dir_path).expect("Couldn't create parse_spotify_songs.json");
    let writer = BufWriter::new(file);

    serde_json::to_writer_pretty(writer, &updated_songs).expect("Failed to write serialized song to file");

    // todo parse file into ECS
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Attributes {
    acousticness: f32,
    danceability: f32,
    energy: f32,
    valence: f32,
    tempo: f32,
    speechiness: f32,
    liveness: f32,
    loudness: f32,
    instrumentalness: f32,
    mode: u32,
    time_signature: u32,
    key: i32,
    genres: Vec<SCGenreObject>
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

#[derive(Debug, Serialize, Deserialize)]
pub struct MinimalTrackObject {
    pub name: String,
    // Timestamp is returned in ISO 8601 format as Coordinated Universal Time (UTC) with a zero offset
    // YYYY-MM-DDTHH:MM:SSZ
    timestamp: String,
    duration_ms: u32, // in milliseconds
    explicit: bool,
    pub spotify_id: String,
    popularity: u16,
    //* Disc and track number may be redundant */
    disc_number: u16,
    track_number: u16,
    album: MinimalAlbumObject,
    artists: Vec<MinimalArtistObject>,
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

#[derive(Debug, Serialize, Deserialize)]
pub struct MinimalAlbumObject {
    album_type: AlbumType,
    total_tracks: u16,
    spotify_id: SpotifyID,
    images: Vec<ImageObject>,
    name: String,
    release_date: String, // E.g "1981-12"
    release_date_precision: ReleaseDatePrecision,
    artists: Vec<MinimalArtistObject>
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

#[derive(Debug, Serialize, Deserialize)]
pub enum AlbumType {
    Album,
    Single,
    Compilation
}

#[derive(Debug, Serialize, Deserialize)]
pub enum ReleaseDatePrecision {
    Year,
    Month,
    Day
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MinimalArtistObject {
    href: String,
    spotify_id: SpotifyID,
    name: String,
}

impl From<SimplifiedArtistObject> for MinimalArtistObject {
    fn from(art_obj: SimplifiedArtistObject) -> Self {
        Self { href: art_obj.href, spotify_id: art_obj.id, name: art_obj.name }
    }
}