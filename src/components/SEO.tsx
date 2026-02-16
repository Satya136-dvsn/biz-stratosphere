// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    author?: string;
    image?: string;
    url?: string;
    type?: string;
}

export function SEO({
    title = "Biz Stratosphere - AI Business Intelligence",
    description = "AI-Powered Business Intelligence Platform with RAG chatbot, ML predictions, and real-time analytics.",
    keywords = "business intelligence, AI analytics, ML predictions, RAG chatbot, data visualization, enterprise analytics",
    author = "Biz Stratosphere",
    image = "/logo-full.png",
    url = "https://biz-stratosphere.com",
    type = "website"
}: SEOProps) {
    const fullTitle = title === "Biz Stratosphere" ? title : `${title} | Biz Stratosphere`;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            <meta name="author" content={author} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={url} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
        </Helmet>
    );
}
