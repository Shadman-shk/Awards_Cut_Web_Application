import TemplatesGrid from './TemplatesGrid';

export default function AllTemplates() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <TemplatesGrid />
      </div>
    </div>
  );
}
