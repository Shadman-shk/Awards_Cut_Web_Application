import CategoryTemplates from '../CategoryTemplates';

export default function LuxuryTemplates() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <CategoryTemplates categoryType="luxury" />
      </div>
    </div>
  );
}
