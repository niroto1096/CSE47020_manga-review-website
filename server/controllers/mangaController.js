const mangaModel = require('../models/mangaModel')
const fs = require('fs');
const path = require('path');

exports.uploadManga = async (req, res) => {
  try {
    const {
      title,
      featured,
      details,
      
      genre,
      theme,
      rating,
      author,
      synopsis,
      release_year,
     
      volume,
      chapter,
 
    } = req.body;

    const image = req.file;

    if (!image) {
      return res.status(400).json({ message: "Image is required" });
    }

    // Convert genre and theme to arrays if needed
    const parsedGenre = Array.isArray(genre)
      ? genre
      : typeof genre === "string"
      ? genre.split(",").map((g) => g.trim())
      : [];

    const parsedTheme = Array.isArray(theme)
      ? theme
      : typeof theme === "string"
      ? theme.split(",").map((t) => t.trim())
      : [];

    const newManga = await mangaModel.create({
      title,
      featured,
      details,

      genre: parsedGenre,
      theme: parsedTheme,
      rating,
      author,
      synopsis,
      release_year,
      volume,
      chapter,
  
      image: image.path,
    });

    res.status(200).json({
      message: "Manga uploaded successfully",
      data: newManga,
    });
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};




exports.getAllManga = async (req, res) => {
  try {
    const search = req.query.search || '';

    const movies = await mangaModel.find({
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { main_cast: { $regex: search, $options: 'i' } }
      ]
    });

    res.status(200).json(movies);
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
};



exports.deleteManga =async(req,res)=>{
    try{
        const {id} = req.params;

        await mangaModel.findByIdAndDelete(id)
        res.status(200).json("Deleted")
    }catch(error){
        console.log("internal Server Error")
    }
}


exports.updateManga = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // expects true or false

    const updatedMovie = await mangaModel.findByIdAndUpdate(
      id,
      { featured: status },
      { new: true } // return the updated document
    );

    if (!updatedMovie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    return res.status(200).json({ message: "Movie updated", data: updatedMovie });
  } catch (error) {
    console.error("Error updating movie:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


exports.getMangaById  = async(req,res) =>{
    try{
        const {id} = req.params;
        console.log("hi")
        const movie = await mangaModel.findById(id)
        res.status(200).json(movie)
    }catch(error){
        res.status(500).json("Internal Server Error")
    }
}


 