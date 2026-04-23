'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { templates, typeLabels, typeColors } from '@/lib/templatesData';
import { Star, Crown, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function TemplatesPage() {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Get unique categories with their templates
  const categories = Object.entries(typeLabels).map(([key, label]) => {
    const categoryTemplates = templates.filter(t => t.type === key);
    const featured = categoryTemplates[0];
    return {
      key,
      label,
      templates: categoryTemplates,
      featured,
    };
  });

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Award Video Templates
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose from professionally designed templates to create stunning award ceremony videos. Each template is fully customizable to match your brand identity.
          </p>
        </motion.div>

        {/* Featured Templates */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Popular Templates</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.filter(t => t.popular).map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group relative rounded-xl overflow-hidden bg-card border border-border/50 hover:border-border transition-all hover:shadow-lg"
              >
                {/* Template badge */}
                <div className="absolute top-3 left-3 z-10 flex gap-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${typeColors[template.type]}`}>
                    {template.name}
                  </span>
                </div>

                {/* Preview */}
                <div className={`aspect-video bg-gradient-to-br ${template.gradient} flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-black/0 to-black/20 group-hover:from-black/10 group-hover:to-black/30 transition-all" />
                  {template.popular && (
                    <Star className="absolute w-8 h-8 text-amber-400 opacity-50" />
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{template.name}</h3>
                    {template.proOnly && (
                      <Crown className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                  <Link
                    href="/templates/all-templates"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 group/link"
                  >
                    View Template <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Browse by Category</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category, index) => (
              <motion.div
                key={category.key}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onHoverStart={() => setHoveredCategory(category.key)}
                onHoverEnd={() => setHoveredCategory(null)}
                className="relative group"
              >
                <Link href="/templates/all-templates">
                  <div className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
                    hoveredCategory === category.key
                      ? 'border-blue-600 bg-blue-600/5'
                      : 'border-border/50 bg-card hover:border-border'
                  }`}>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {category.label}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {category.templates.length} template{category.templates.length !== 1 ? 's' : ''}
                    </p>
                    {category.featured && (
                      <p className="text-xs text-muted-foreground italic">
                        Featured: {category.featured.name}
                      </p>
                    )}
                    <motion.div
                      className="mt-3 flex items-center gap-2 text-blue-600 font-medium"
                      initial={{ x: 0 }}
                      animate={{ x: hoveredCategory === category.key ? 4 : 0 }}
                    >
                      Explore <ArrowRight className="h-4 w-4" />
                    </motion.div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center p-8 rounded-xl bg-gradient-to-r from-blue-600/10 to-amber-600/10 border border-blue-600/20"
        >
          <h3 className="text-2xl font-bold text-foreground mb-3">
            Ready to create stunning award videos?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            All templates are fully customizable. Upload your logo, adjust colors, and create professional award videos in minutes.
          </p>
          <Link
            href="/templates/all-templates"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Browse All Templates <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
