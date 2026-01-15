import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Copy, Check } from 'lucide-react';

// Du Bois color palette
const colors = {
  parchment: '#E8DCC4',
  parchmentDark: '#D4C4A8',
  crimson: '#C41E3A',
  gold: '#D4A84B',
  black: '#1A1A1A',
  green: '#2D6A4F',
  blue: '#5B7C99',
  brown: '#6B4423',
  cream: '#F5F0E1',
};

const NoSQLSite = () => {
  const [openSection, setOpenSection] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getSectionSlug = (tag: string) => tag.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const findSectionIndexBySlug = (slug: string) => {
    return content.findIndex(section => getSectionSlug(section.claimTag) === slug);
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        const sectionIndex = findSectionIndexBySlug(hash);
        if (sectionIndex !== -1) {
          setOpenSection(sectionIndex);
        }
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSectionToggle = (index: number) => {
    const newOpenSection = openSection === index ? null : index;
    setOpenSection(newOpenSection);

    if (newOpenSection !== null) {
      const slug = getSectionSlug(content[index].claimTag);
      window.history.pushState(null, '', `#${slug}`);
    } else {
      window.history.pushState(null, '', window.location.pathname);
    }
  };

  const copyToClipboard = async (text: string, index: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const content = [
    {
      claimTag: "Dynamic Schema Needs",
      detailedClaim: "NoSQL databases allow developers to add new fields and change data structures on the fly without requiring schema migrations or downtime. This flexibility is particularly valuable during rapid development cycles or when dealing with external data sources that may change structure unexpectedly.",
      rebuttal: "PostgreSQL's JSONB type provides all the schema flexibility of a document store while maintaining ACID compliance and the power of SQL querying. Moreover, it allows you to gradually formalize your schema as your data model stabilizes, giving you the best of both worlds.",
      noSqlCode: `// MongoDB approach
db.users.insert({
  name: "John",
  email: "john@example.com",
  preferences: {
    theme: "dark",
    notifications: true
  }
})

// Add new field without migration
db.users.update(
  { email: "john@example.com" },
  { $set: { newField: "value" } }
)`,
      sqlCode: `-- PostgreSQL JSONB approach
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  data JSONB
);

INSERT INTO users (data) VALUES ('{
  "name": "John",
  "email": "john@example.com",
  "preferences": {
    "theme": "dark",
    "notifications": true
  }
}');

-- Add new field just as easily
UPDATE users
SET data = data || '{"newField": "value"}'::jsonb
WHERE data->>'email' = 'john@example.com';`
    },
    {
      claimTag: "Scale-Out Architecture",
      detailedClaim: "NoSQL databases are built from the ground up for horizontal scalability, making it easier to handle large-scale applications by adding more machines to the cluster.",
      rebuttal: "PostgreSQL offers multiple robust solutions for horizontal scaling, including built-in table partitioning, logical replication, and extensions like Citus that enable true distributed SQL capabilities.",
      noSqlCode: `// MongoDB sharding setup
sh.enableSharding("mydb")
sh.shardCollection("mydb.users",
  {user_id: "hashed"})

// Add more shards as needed
sh.addShard("mongodb0.example.net:27017")
sh.addShard("mongodb1.example.net:27017")`,
      sqlCode: `-- PostgreSQL native partitioning
CREATE TABLE users (
  user_id bigint NOT NULL,
  created_at timestamp NOT NULL,
  data jsonb
) PARTITION BY HASH (user_id);

-- Create partitions
CREATE TABLE users_0 PARTITION OF users
  FOR VALUES WITH (modulus 4, remainder 0);
CREATE TABLE users_1 PARTITION OF users
  FOR VALUES WITH (modulus 4, remainder 1);

-- Using Citus for distributed SQL
CREATE EXTENSION citus;
SELECT create_distributed_table('users', 'user_id');`
    },
    {
      claimTag: "Complex Data Hierarchies",
      detailedClaim: "NoSQL document stores are better suited for handling deeply nested, hierarchical data structures that mirror the object structures used in application code.",
      rebuttal: "PostgreSQL's combination of JSONB for flexible structures and recursive CTEs for hierarchical querying provides more powerful tools for handling complex data structures than document stores, while maintaining data integrity.",
      noSqlCode: `// MongoDB nested document
db.departments.insert({
  name: "Engineering",
  manager: {
    name: "Jane",
    title: "Director"
  },
  teams: [{
    name: "Frontend",
    lead: "Bob",
    members: ["Alice", "Charlie"]
  }]
})`,
      sqlCode: `-- PostgreSQL hierarchical data
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  structure JSONB,
  parent_id INTEGER REFERENCES departments(id)
);

-- Query with recursive CTE
WITH RECURSIVE dept_tree AS (
  SELECT id, name, structure, 1 as level
  FROM departments WHERE parent_id IS NULL
  UNION ALL
  SELECT d.id, d.name, d.structure, dt.level + 1
  FROM departments d
  JOIN dept_tree dt ON d.parent_id = dt.id
)
SELECT * FROM dept_tree ORDER BY level;`
    },
    {
      claimTag: "Performance at Scale",
      detailedClaim: "NoSQL databases provide better performance for specific access patterns and very large datasets by sacrificing consistency guarantees.",
      rebuttal: "PostgreSQL's sophisticated query planner, extensive indexing options, and materialized views often provide better performance than NoSQL solutions while maintaining ACID compliance.",
      noSqlCode: `// MongoDB indexes
db.users.createIndex(
  { "lastLogin": 1, "status": 1 }
)

// Simple range query
db.users.find({
  lastLogin: {
    $gte: new Date('2024-01-01'),
    $lt: new Date('2024-02-01')
  }
})`,
      sqlCode: `-- PostgreSQL specialized indexing
-- BRIN index for time-series data
CREATE INDEX idx_logins_brin
ON user_logins USING BRIN (login_timestamp);

-- Partial index for active users only
CREATE INDEX idx_active_users
ON users (last_login)
WHERE status = 'active';

-- Materialized view for analytics
CREATE MATERIALIZED VIEW user_stats AS
SELECT date_trunc('day', created_at) as day,
       count(*) as new_users
FROM users GROUP BY 1;`
    },
    {
      claimTag: "Developer Experience",
      detailedClaim: "NoSQL databases provide a more natural development experience by allowing developers to store data in the same format as their application objects.",
      rebuttal: "Modern PostgreSQL features like JSONB, composite types, and array types provide the same developer convenience while maintaining data integrity.",
      noSqlCode: `// MongoDB document
db.products.insert({
  name: "Widget",
  price: 99.99,
  tags: ["electronics", "gadget"],
  specs: {
    weight: "250g",
    dimensions: "10x5x2cm"
  }
})`,
      sqlCode: `-- PostgreSQL modern types
CREATE TYPE product_specs AS (
  weight text,
  dimensions text
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name text NOT NULL,
  price decimal(10,2),
  tags text[],
  specs product_specs
);

-- Rich querying capabilities
SELECT * FROM products
WHERE tags @> ARRAY['electronics']
  AND (specs).weight = '250g';`
    },
    {
      claimTag: "Geographic Distribution",
      detailedClaim: "NoSQL databases handle globally distributed deployments better, with built-in support for eventual consistency and multi-master replication.",
      rebuttal: "PostgreSQL's logical replication, combined with extensions like BDR, provides sophisticated multi-region deployment options with tunable consistency levels.",
      noSqlCode: `// MongoDB replica set config
rs.add("node1.us-east.example.com")
rs.add("node2.eu-west.example.com")

// Read from nearest node
db.users.find().readPref("nearest")`,
      sqlCode: `-- PostgreSQL logical replication
CREATE PUBLICATION app_publication
FOR TABLE users, orders;

CREATE SUBSCRIPTION app_subscription
CONNECTION 'host=primary-db.example.com'
PUBLICATION app_publication;

-- Conflict resolution with BDR
CREATE OR REPLACE FUNCTION resolve_conflict()
RETURNS trigger AS $$
BEGIN
  IF NEW.updated_at > OLD.updated_at THEN
    RETURN NEW;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;`
    },
    {
      claimTag: "Real-World Performance",
      detailedClaim: "NoSQL databases are necessary for high-performance applications. Traditional SQL databases cannot handle the load of modern web-scale applications.",
      rebuttal: "PostgreSQL powers some of the world's largest applications. Instagram handles 1+ billion users, Uber processes 10+ million writes per second, and Reddit, Twitch, and Apple iCloud all rely on PostgreSQL.",
      noSqlCode: `// MongoDB scaling claims
- "Web-scale" by default
- Eventually consistent
- Horizontal scaling
- No ACID overhead
- Schema-free performance`,
      sqlCode: `-- PostgreSQL real-world stats
- Instagram: 1B+ users
- Uber: 10M+ writes/second
- Reddit: Main database
- Twitch: Core infrastructure
- Apple iCloud: User data

-- Performance features
- Parallel query execution
- Just-In-Time compilation
- Advanced query planning`
    },
    {
      claimTag: "Enterprise Support",
      detailedClaim: "NoSQL databases offer better enterprise support and commercial backing for mission-critical deployments.",
      rebuttal: "PostgreSQL has a robust enterprise support ecosystem including EDB, AWS RDS, Google CloudSQL, Azure, Crunchy Data, and 2ndQuadrant offering 24/7 support.",
      noSqlCode: `// MongoDB Enterprise
- Atlas cloud platform
- Single vendor support
- Commercial licensing
- Proprietary tools
- Vendor lock-in risks`,
      sqlCode: `-- PostgreSQL Enterprise
- Multiple vendors available
- Open-source foundation
- No vendor lock-in
- 24/7 support options
- Active security patches
- Cloud-native solutions`
    }
  ];

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: colors.parchment,
        fontFamily: "'EB Garamond', 'Times New Roman', serif"
      }}
    >
      {/* Paper texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Decorative border */}
      <div className="fixed inset-4 border-2 pointer-events-none" style={{ borderColor: colors.brown + '40' }} />
      <div className="fixed inset-6 border pointer-events-none" style={{ borderColor: colors.brown + '20' }} />

      {/* Header */}
      <header className="relative pt-16 pb-12 px-8 text-center">
        {/* Decorative line */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-16" style={{ backgroundColor: colors.brown }} />
          <div className="w-3 h-3 rotate-45 border" style={{ borderColor: colors.crimson }} />
          <div className="h-px w-16" style={{ backgroundColor: colors.brown }} />
        </div>

        <h1
          className={`text-5xl md:text-7xl mb-4 tracking-[0.2em] transition-all duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}
          style={{
            fontFamily: "'Libre Baskerville', serif",
            color: colors.black,
            fontWeight: 400
          }}
        >
          NO, SQL.
        </h1>

        <p
          className="text-lg md:text-xl tracking-[0.15em] uppercase mb-8"
          style={{
            color: colors.brown,
            fontFamily: "'EB Garamond', serif"
          }}
        >
          Why PostgreSQL is Probably the Answer
        </p>

        <p
          className="text-sm tracking-[0.2em] uppercase"
          style={{ color: colors.blue }}
        >
          A Series of Arguments Prepared for the Consideration of Software Engineers
        </p>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-4 mt-10">
          <div className="h-px flex-1 max-w-32" style={{ backgroundColor: colors.brown + '60' }} />
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="rotate-0">
            <circle cx="12" cy="12" r="8" stroke={colors.crimson} strokeWidth="1.5" fill="none" />
            <circle cx="12" cy="12" r="3" fill={colors.gold} />
          </svg>
          <div className="h-px flex-1 max-w-32" style={{ backgroundColor: colors.brown + '60' }} />
        </div>

      </header>

      {/* Main content */}
      <main className="relative max-w-6xl mx-auto px-8 py-8">
        <div className="space-y-6">
          {content.map((section, index) => {
            const sectionSlug = getSectionSlug(section.claimTag);
            const isOpen = openSection === index;
            const sectionColor = [colors.crimson, colors.gold, colors.green, colors.blue, colors.brown][index % 5];

            return (
              <div
                key={index}
                id={sectionSlug}
                className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${150 + index * 100}ms` }}
              >
                {/* Accordion header */}
                <button
                  onClick={() => handleSectionToggle(index)}
                  className="w-full group relative"
                  style={{ backgroundColor: colors.cream }}
                >
                  {/* Left color bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: sectionColor }}
                  />

                  <div className="px-8 py-5 flex justify-between items-center border-y" style={{ borderColor: colors.brown + '30' }}>
                    {/* Number */}
                    <span
                      className="text-4xl mr-6 opacity-30"
                      style={{
                        fontFamily: "'Libre Baskerville', serif",
                        color: colors.black
                      }}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <h2
                      className="flex-1 text-left text-lg md:text-xl tracking-[0.1em] uppercase group-hover:tracking-[0.15em] transition-all"
                      style={{
                        fontFamily: "'Libre Baskerville', serif",
                        color: colors.black
                      }}
                    >
                      {section.claimTag}
                    </h2>

                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                      style={{ borderColor: colors.brown }}
                    >
                      <ChevronDown size={16} style={{ color: colors.brown }} />
                    </div>
                  </div>
                </button>

                {/* Accordion content */}
                <div
                  ref={el => contentRefs.current[index] = el}
                  className={`overflow-hidden transition-all duration-500 ease-out ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                  style={{
                    maxHeight: isOpen ? `${(contentRefs.current[index]?.scrollHeight || 2000) + 100}px` : '0px',
                  }}
                >
                  <div
                    className="p-8 border-x border-b"
                    style={{
                      backgroundColor: colors.cream,
                      borderColor: colors.brown + '30'
                    }}
                  >
                    {/* The Claim */}
                    <div className="mb-8">
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: colors.gold }}
                        />
                        <h3
                          className="text-sm tracking-[0.2em] uppercase"
                          style={{ color: colors.brown }}
                        >
                          The Claim
                        </h3>
                      </div>
                      <p
                        className="text-base leading-relaxed pl-7"
                        style={{
                          color: colors.black,
                          fontFamily: "'EB Garamond', serif"
                        }}
                      >
                        {section.detailedClaim}
                      </p>
                    </div>

                    {/* The Reality */}
                    <div className="mb-8">
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: colors.green }}
                        />
                        <h3
                          className="text-sm tracking-[0.2em] uppercase"
                          style={{ color: colors.brown }}
                        >
                          The Reality
                        </h3>
                      </div>
                      <p
                        className="text-base leading-relaxed pl-7"
                        style={{
                          color: colors.black,
                          fontFamily: "'EB Garamond', serif",
                          fontWeight: 500
                        }}
                      >
                        {section.rebuttal}
                      </p>
                    </div>

                    {/* Code comparison */}
                    <div>
                      <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="h-px flex-1" style={{ backgroundColor: colors.brown + '40' }} />
                        <span
                          className="text-xs tracking-[0.2em] uppercase"
                          style={{ color: colors.brown }}
                        >
                          Show Me The Code
                        </span>
                        <div className="h-px flex-1" style={{ backgroundColor: colors.brown + '40' }} />
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        {/* NoSQL Code */}
                        <div className="relative">
                          <div
                            className="px-4 py-2 border-t border-x flex items-center justify-between"
                            style={{
                              backgroundColor: colors.parchmentDark,
                              borderColor: colors.brown + '40'
                            }}
                          >
                            <span
                              className="text-xs tracking-[0.15em] uppercase"
                              style={{ color: colors.brown }}
                            >
                              NoSQL Approach
                            </span>
                            <button
                              onClick={() => copyToClipboard(section.noSqlCode, `nosql-${index}`)}
                              className="p-1 hover:opacity-70 transition-opacity"
                            >
                              {copiedIndex === `nosql-${index}` ? (
                                <Check size={14} style={{ color: colors.green }} />
                              ) : (
                                <Copy size={14} style={{ color: colors.brown }} />
                              )}
                            </button>
                          </div>
                          <pre
                            className="p-4 overflow-x-auto text-sm border"
                            style={{
                              backgroundColor: colors.black,
                              borderColor: colors.brown + '40',
                              fontFamily: "'Courier Prime', monospace",
                              color: colors.parchment
                            }}
                          >
                            <code>{section.noSqlCode}</code>
                          </pre>
                        </div>

                        {/* PostgreSQL Code */}
                        <div className="relative">
                          {/* Winner indicator */}
                          <div
                            className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center z-10"
                            style={{ backgroundColor: colors.crimson }}
                          >
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>

                          <div
                            className="px-4 py-2 border-t border-x flex items-center justify-between"
                            style={{
                              backgroundColor: colors.blue,
                              borderColor: colors.blue
                            }}
                          >
                            <span
                              className="text-xs tracking-[0.15em] uppercase"
                              style={{ color: colors.cream }}
                            >
                              PostgreSQL Solution
                            </span>
                            <button
                              onClick={() => copyToClipboard(section.sqlCode, `sql-${index}`)}
                              className="p-1 hover:opacity-70 transition-opacity"
                            >
                              {copiedIndex === `sql-${index}` ? (
                                <Check size={14} style={{ color: colors.green }} />
                              ) : (
                                <Copy size={14} style={{ color: colors.cream }} />
                              )}
                            </button>
                          </div>
                          <pre
                            className="p-4 overflow-x-auto text-sm border-2"
                            style={{
                              backgroundColor: colors.black,
                              borderColor: colors.blue,
                              fontFamily: "'Courier Prime', monospace",
                              color: colors.parchment
                            }}
                          >
                            <code>{section.sqlCode}</code>
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative py-16 px-8 text-center mt-8">
        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-24" style={{ backgroundColor: colors.brown + '60' }} />
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: colors.crimson }}
          />
          <div className="h-px w-24" style={{ backgroundColor: colors.brown + '60' }} />
        </div>

        <p
          className="text-sm tracking-[0.15em] uppercase mb-2"
          style={{ color: colors.brown }}
        >
          Use the Right Tool, Not the Shiny One
        </p>

        <p
          className="text-xs tracking-[0.1em]"
          style={{ color: colors.blue }}
        >
          Prepared by{' '}
          <a
            href="https://estsauver.com"
            className="underline hover:no-underline"
            style={{ color: colors.crimson }}
          >
            Earl St Sauver
          </a>
        </p>

        <p
          className="text-[10px] tracking-[0.2em] uppercase mt-6 leading-relaxed"
          style={{ color: colors.brown + '80' }}
        >
          Inspired by{' '}
          <a
            href="https://www.searchablemuseum.com/w-e-b-du-bois-at-the-1900-paris-exposition/#data-portraits-of-black-life-in-1900"
            className="underline hover:no-underline"
            style={{ color: colors.blue }}
          >
            W.E.B. Du Bois's Data Visualizations
          </a>
          <br />
          Prepared for the 1900 Paris World Fair
        </p>
      </footer>
    </div>
  );
};

export default NoSQLSite;
