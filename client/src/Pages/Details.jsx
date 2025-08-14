import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getMangaById } from '@/Api/mangaApi';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';

const Details = () => {
  const { id } = useParams();
  const [manga, setManga] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchManga = async () => {
      try {
        const res = await getMangaById(id);
        setManga(res.data);
      } catch (err) {
        console.error('Failed to fetch manga:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchManga();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!manga) {
    return (
      <p className="text-center mt-10 text-gray-500">Manga not found.</p>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white px-4 py-20">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <h1 className="text-4xl font-bold">{manga.title}</h1>
        <p className="text-gray-400 text-sm italic">Author: {manga.author || 'N/A'}</p>
      </div>

      {/* Tab Bar (Placeholder style) */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex gap-6 border-b border-gray-700 text-sm">
          <div className="pb-2 border-b-2 border-blue-600 font-semibold">OVERVIEW</div>
         
        </div>
      </div>

      {/* Main Section */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Left: Cover Image */}
        <div className="md:w-1/4 w-full">
          <img
            src={`http://localhost:8000/${manga.image}`}
            alt={manga.title}
            className="rounded-lg object-cover w-full"
          />
        </div>

        {/* Right: Info Section */}
        <div className="md:w-3/4 w-full space-y-4">
          <div className="flex flex-wrap gap-4 text-sm text-gray-300">
            <p><strong>Ch:</strong> {manga.chapter || 'N/A'}</p>
            <p><strong>Volume:</strong> {manga.volume}</p>
            <p><strong>Year:</strong> {manga.release_year || 'N/A'}</p>
            <p><strong>⭐</strong> {manga.rating || 0}/10</p>
            <p><strong>Rank:</strong> #{manga.rank || 'N/A'}</p>
          </div>

          {/* Synopsis preview */}
          <p className="text-gray-300 text-sm leading-relaxed">
            {manga.synopsis}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {(manga.genre || []).map((tag, i) => (
              <span key={i} className="bg-gray-700 px-3 py-1 rounded-full text-xs">{`Genre ${tag}`}</span>
            ))}
            {(manga.theme || []).map((tag, i) => (
              <span key={i} className="bg-gray-700 px-3 py-1 rounded-full text-xs">{`Theme ${tag}`}</span>
            ))}
          </div>

          {/* Dropdown (mock) */}
          <div className="mt-6 text-sm">
            <label htmlFor="mangaStatus" className="mr-2">MY MANGA:</label>
            <select
              id="mangaStatus"
              className="bg-gray-800 text-white px-2 py-1 rounded border border-gray-600"
            >
              <option>Unread</option>
              <option>Reading</option>
              <option>Completed</option>
            </select>
          </div>

          {/* Stats */}
          <div className="mt-6 text-sm text-gray-400">
            <p><strong>User Stats:</strong> 4,490 users are tracking this.</p>
          </div>
        </div>
      </div>

      {/* Tabs Below */}
      <div className="max-w-6xl mx-auto mt-10">
        <Tabs defaultValue="synopsis">
          <TabsList className="bg-gray-800 rounded-lg w-full flex justify-start gap-6 px-4 py-2 mb-4">
            <TabsTrigger value="synopsis">Synopsis</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>

          <TabsContent value="synopsis">
            <div className="bg-[#1e1e1e] p-6 rounded-lg text-gray-200 leading-relaxed">
              {manga.details || 'No synopsis available.'}
            </div>
          </TabsContent>

          <TabsContent value="comments">
            <div className="bg-[#1e1e1e] p-6 rounded-lg text-gray-400 italic">
              No comments yet. Be the first to comment!
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Details;
