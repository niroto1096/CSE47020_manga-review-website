import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAllManga,deleteManga,updateManga } from "@/Api/mangaApi";

const AllManga = () => {
  const [manga, setManga] = useState([]);
  const [search, setSearch] = useState("");
  

  useEffect(() => {
    fetchManga();
  }, [search]);

  const fetchManga = async () => {
    try {
      const res = await getAllManga(search);
      setManga(res.data);
    } catch (err) {
      console.error(err);
    }
  };


  const handleDelete =async(id)=>{
    try{
        await deleteManga(id)
        fetchManga();
    }catch(err){
        console.log(err)
    }
  }


  const handleUpdate = async(id,status)=>{
    try{
        await updateManga(id,!status)
        fetchManga()
    }catch(error){
        console.log(error)
    }
  }
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-semibold mt-40">All Manga</h2>
        <Input
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-64"
        />
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Title</TableHead>
              <TableHead className="text-left">Genre</TableHead>
              <TableHead className="text-left">Release Date</TableHead>
              <TableHead className="text-center">Featured</TableHead>
              <TableHead className="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {manga.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  No manga found.
                </TableCell>
              </TableRow>
            ) : (
              manga.map((manga) => (
                <TableRow key={manga._id}>
                  <TableCell className="text-left">{manga.title}</TableCell>
                  <TableCell className="text-left">{manga.genre}</TableCell>
                  <TableCell className="text-left">
                    {manga.release_date?.split("T")[0]}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={
                        manga.featured
                          ? "text-green-600 font-medium"
                          : "text-gray-500"
                      }
                    >
                      {manga.featured ? "Yes" : "No"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right pr-6 space-x-2">
                    <Button size="sm" variant="outline" onClick={()=>handleUpdate(manga._id,manga.featured)}>
                      {manga.featured ? "Unfeature" : "Feature"}
                    </Button>
                    <Button size="sm" variant="destructive" onClick = {()=>handleDelete(manga._id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AllManga;
