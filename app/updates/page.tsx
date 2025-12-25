import Link from "next/link";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  published_at: string; // ISO date
};

const samplePosts: Post[] = [
  {
    id: "1",
    title: "Welcome to FastLink Updates",
    slug: "welcome-to-fastlink-updates",
    excerpt: "A new space for platform news, product releases, and tips.",
    published_at: "2025-01-05T10:00:00Z",
  },
  {
    id: "2",
    title: "Hiring Faster with FastLink",
    slug: "hiring-faster-with-fastlink",
    excerpt: "How businesses can cut time-to-hire with FastLink tools.",
    published_at: "2024-12-12T12:00:00Z",
  },
  {
    id: "3",
    title: "Job Seeker Tips for 2025",
    slug: "job-seeker-tips-2025",
    excerpt: "Resume, applications, and messaging best practices.",
    published_at: "2024-11-20T09:00:00Z",
  },
];

export default function UpdatesPage() {
  const posts = [...samplePosts].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/updates/${post.slug}`}
              className="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition"
            >
              <div
                className="w-full h-40 bg-gray-100"
                style={{
                  backgroundImage: "url('/favicon.svg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div className="p-4 space-y-2">
                <h2 className="text-[20px] font-semibold text-gray-900 group-hover:text-blue-600 transition">
                  {post.title}
                </h2>
                <p className="text-[18px] text-gray-600 line-clamp-2">{post.excerpt}</p>
                <div className="text-[18px] font-semibold text-blue-600 pt-2">
                  {new Date(post.published_at).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

