'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getClientWorkspaceSlug, withWorkspace } from '@/lib/workspace-client';

interface Site {
  id: string;
  slug: string;
  title: string;
  content: string | null;
  isPublished: boolean;
  template: { name: string } | null;
}

interface Block {
  id: string;
  type: string;
  content: string;
}

const BLOCK_TYPES = [
  { type: 'heading', label: 'Heading', default: 'Welcome to My Site' },
  { type: 'text', label: 'Text', default: 'Add your content here...' },
  { type: 'image', label: 'Image', default: 'https://placehold.co/600x300' },
  { type: 'listings', label: 'Listings Grid', default: '' },
  { type: 'contact', label: 'Contact Form', default: '' },
  { type: 'testimonials', label: 'Testimonials', default: 'Client review here...' },
];

export default function WebsiteBuilderPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState('My Agent Site');
  const [slug, setSlug] = useState('my-site');
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    fetch('/api/websites?workspaceId=${getClientWorkspaceSlug()}')
      .then(r => r.json())
      .then(setSites)
      .catch(console.error);
  }, []);

  const addBlock = (type: string) => {
    const bt = BLOCK_TYPES.find(b => b.type === type);
    setBlocks(prev => [...prev, {
      id: `block-${Date.now()}`,
      type,
      content: bt?.default || '',
    }]);
  };

  const updateBlock = (id: string, content: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const moveBlock = (id: string, dir: -1 | 1) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      const newBlocks = [...prev];
      const [moved] = newBlocks.splice(idx, 1);
      newBlocks.splice(idx + dir, 0, moved);
      return newBlocks;
    });
  };

  const saveSite = async () => {
    await fetch('/api/websites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug, title,
        content: blocks,
        workspaceId: getClientWorkspaceSlug(),
      }),
    });
  };

  const renderPreview = () => {
    return blocks.map(b => {
      switch (b.type) {
        case 'heading':
          return <h2 key={b.id} className="text-3xl font-bold mb-4">{b.content}</h2>;
        case 'text':
          return <p key={b.id} className="mb-4 text-gray-700">{b.content}</p>;
        case 'image':
          return <img key={b.id} src={b.content} alt="" className="w-full rounded mb-4" />;
        case 'listings':
          return (
            <div key={b.id} className="grid grid-cols-3 gap-4 mb-4">
              {[1,2,3].map(i => (
                <div key={i} className="bg-gray-100 rounded p-4 text-center text-sm text-gray-500">
                  Listing {i}
                </div>
              ))}
            </div>
          );
        case 'contact':
          return (
            <div key={b.id} className="bg-gray-50 rounded p-4 mb-4">
              <input placeholder="Name" className="border rounded px-3 py-2 w-full mb-2 text-sm" />
              <input placeholder="Email" className="border rounded px-3 py-2 w-full mb-2 text-sm" />
              <textarea placeholder="Message" className="border rounded px-3 py-2 w-full text-sm" rows={3} />
            </div>
          );
        case 'testimonials':
          return (
            <div key={b.id} className="bg-yellow-50 rounded p-4 mb-4 italic text-gray-700">
              &ldquo;{b.content}&rdquo;
            </div>
          );
        default:
          return null;
      }
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Website Builder</h1>
        <div className="flex gap-2">
          <button onClick={() => setPreview(!preview)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-200">
            {preview ? 'Edit' : 'Preview'}
          </button>
          <button onClick={saveSite} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">Save Site</button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Block Palette */}
        <div className="col-span-2">
          <h3 className="font-semibold text-sm text-gray-500 mb-2">ADD BLOCKS</h3>
          <div className="space-y-2">
            {BLOCK_TYPES.map(bt => (
              <button
                key={bt.type}
                onClick={() => addBlock(bt.type)}
                className="w-full text-left bg-white border rounded px-3 py-2 text-sm hover:bg-gray-50"
              >
                + {bt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Editor / Preview */}
        <div className="col-span-10">
          {preview ? (
            <div className="bg-white rounded-lg shadow border p-8 max-w-3xl mx-auto">
              <input value={title} onChange={e => setTitle(e.target.value)} className="text-3xl font-bold w-full border-0 outline-none mb-4" />
              {renderPreview()}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-white rounded-lg shadow border p-4">
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Site Title" className="text-lg font-semibold w-full border rounded px-3 py-2 mb-2" />
                <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="url-slug" className="text-sm w-full border rounded px-3 py-2" />
              </div>
              {blocks.map((block, i) => (
                <div key={block.id} className="bg-white rounded-lg shadow border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase">{block.type}</span>
                    <div className="flex gap-1">
                      <button onClick={() => moveBlock(block.id, -1)} className="text-gray-400 hover:text-gray-600 text-sm" disabled={i === 0}>&uarr;</button>
                      <button onClick={() => moveBlock(block.id, 1)} className="text-gray-400 hover:text-gray-600 text-sm" disabled={i === blocks.length - 1}>&darr;</button>
                      <button onClick={() => removeBlock(block.id)} className="text-red-400 hover:text-red-600 text-sm ml-2">&times;</button>
                    </div>
                  </div>
                  <textarea
                    value={block.content}
                    onChange={e => updateBlock(block.id, e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                    rows={3}
                  />
                </div>
              ))}
              {blocks.length === 0 && (
                <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
                  <p>Add blocks from the left panel to start building your site.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
