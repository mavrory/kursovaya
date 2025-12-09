import { ImageWithFallback } from './ui/ImageWithFallback';

export function EmptyState({ title, description, animalType = 'cat' }) {
  const animalImages = {
    cat: 'https://images.unsplash.com/photo-1643899348858-43ac198cdf18?w=300',
    fox: 'https://images.unsplash.com/photo-1613206468203-fa00870edf79?w=300',
    raccoon: 'https://images.unsplash.com/photo-1683418925797-4c489d50baf2?w=300',
    panda: 'https://images.unsplash.com/photo-1599951420058-5ec049a03e20?w=300',
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-48 h-48 mb-6 opacity-60">
        <ImageWithFallback
          src={animalImages[animalType]}
          alt={title}
          className="w-full h-full object-cover rounded-full"
        />
      </div>
      <h3 className="text-neutral-900 mb-2">{title}</h3>
      <p className="text-neutral-600 text-center max-w-md">{description}</p>
    </div>
  );
}