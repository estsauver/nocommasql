import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Database } from 'lucide-react';

const NoSQLSite = () => {
  const [openSection, setOpenSection] = useState<number | null>(null);
  
  const styles = {
    primary: '#336791',
    secondary: '#2F5E82',
    headerBg: 'linear-gradient(170deg, #336791 0%, #2F5E82 100%)',
    buttonBorderLeft: '4px solid #336791'
  };

  // Function to convert section tag to URL-friendly format
  const getSectionSlug = (tag: string) => tag.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Function to find section index by slug
  const findSectionIndexBySlug = (slug: string) => {
    return content.findIndex(section => getSectionSlug(section.claimTag) === slug);
  };

  // Handle initial load and URL changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove the # symbol
      if (hash) {
        const sectionIndex = findSectionIndexBySlug(hash);
        if (sectionIndex !== -1) {
          setOpenSection(sectionIndex);
        }
      }
    };

    // Handle initial load
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Handle section toggle
  const handleSectionToggle = (index: number) => {
    const newOpenSection = openSection === index ? null : index;
    setOpenSection(newOpenSection);
    
    // Update URL
    if (newOpenSection !== null) {
      const slug = getSectionSlug(content[index].claimTag);
      window.history.pushState(null, '', `#${slug}`);
    } else {
      window.history.pushState(null, '', window.location.pathname);
    }
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
  { $set: { 
      newField: "value" 
    }
  }
)`,
      sqlCode: `-- PostgreSQL JSONB approach
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  data JSONB
);

INSERT INTO users (data) VALUES (
  '{
    "name": "John",
    "email": "john@example.com",
    "preferences": {
      "theme": "dark",
      "notifications": true
    }
  }'
);

-- Add new field just as easily
UPDATE users 
SET data = data || 
  '{"newField": "value"}'::jsonb 
WHERE 
  data->>'email' = 'john@example.com';`
    },
    {
      claimTag: "Scale-Out Architecture",
      detailedClaim: "NoSQL databases are built from the ground up for horizontal scalability, making it easier to handle large-scale applications by adding more machines to the cluster. This is particularly important for applications that need to handle high write throughput.",
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

-- Using Citus for true distributed SQL
CREATE EXTENSION citus;
SELECT create_distributed_table(
  'users', 'user_id'
);`
    },
    {
      claimTag: "Complex Data Hierarchies",
      detailedClaim: "NoSQL document stores are better suited for handling deeply nested, hierarchical data structures that mirror the object structures used in application code. This makes it more natural to work with complex data models.",
      rebuttal: "PostgreSQL's combination of JSONB for flexible structures and recursive CTEs for hierarchical querying provides more powerful tools for handling complex data structures than document stores, while maintaining data integrity.",
      noSqlCode: `// MongoDB nested document
db.departments.insert({
  name: "Engineering",
  manager: {
    name: "Jane",
    title: "Engineering Director"
  },
  teams: [{
    name: "Frontend",
    lead: "Bob",
    members: ["Alice", "Charlie"]
  }, {
    name: "Backend",
    lead: "Dave",
    members: ["Eve", "Frank"]
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
  SELECT id, name, structure, parent_id, 
         1 as level
  FROM departments
  WHERE parent_id IS NULL
  
  UNION ALL
  
  SELECT d.id, d.name, d.structure, 
         d.parent_id, dt.level + 1
  FROM departments d
  JOIN dept_tree dt ON d.parent_id = dt.id
)
SELECT 
  repeat('  ', level - 1) || name as department,
  structure#>>'{manager,name}' as manager
FROM dept_tree
ORDER BY level, name;`
    },
    {
      claimTag: "Performance at Scale",
      detailedClaim: "NoSQL databases provide better performance for specific access patterns and very large datasets by sacrificing consistency guarantees and complex querying capabilities.",
      rebuttal: "PostgreSQL's sophisticated query planner, extensive indexing options, and materialized views often provide better performance than NoSQL solutions while maintaining ACID compliance. For specific access patterns, specialized indexes like BRIN, GiST, and GIN can outperform NoSQL solutions.",
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
CREATE INDEX idx_user_logins_brin 
ON user_logins USING BRIN (login_timestamp)
WITH (pages_per_range = 128);

-- Partial index for active users
CREATE INDEX idx_active_users 
ON users (last_login)
WHERE status = 'active';

-- Materialized view for analytics
CREATE MATERIALIZED VIEW user_stats AS
SELECT 
  date_trunc('day', created_at) as day,
  count(*) as new_users,
  count(*) FILTER (WHERE status = 'active') 
    as active_users
FROM users
GROUP BY 1
WITH DATA;`
    },
    {
      claimTag: "Developer Experience",
      detailedClaim: "NoSQL databases provide a more natural development experience by allowing developers to store data in the same format as their application objects, reducing the need for complex object-relational mapping.",
      rebuttal: "Modern PostgreSQL features like JSONB, composite types, and array types provide the same developer convenience while maintaining data integrity. Additionally, tools like PostgREST can automatically generate REST APIs from your database schema.",
      noSqlCode: `// MongoDB document
db.products.insert({
  name: "Widget",
  price: 99.99,
  tags: ["electronics", "gadget"],
  specs: {
    weight: "250g",
    dimensions: "10x5x2cm"
  }
})

// Query nested fields
db.products.find({
  "specs.weight": "250g",
  tags: "electronics"
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
  specs product_specs,
  extra_data JSONB
);

-- Rich querying capabilities
SELECT * FROM products 
WHERE 
  tags @> ARRAY['electronics']
  AND (specs).weight = '250g'
  AND extra_data @> '{"color": "blue"}'::jsonb;`
    },
    {
      claimTag: "Geographic Distribution",
      detailedClaim: "NoSQL databases handle globally distributed deployments better, with built-in support for eventual consistency and multi-master replication across regions.",
      rebuttal: "PostgreSQL's logical replication, combined with extensions like BDR (Bi-Directional Replication) and Citus, provides sophisticated multi-region deployment options with tunable consistency levels and conflict resolution strategies.",
      noSqlCode: `// MongoDB replica set config
rs.add("node1.us-east.example.com")
rs.add("node2.eu-west.example.com")

// Read from nearest node
db.users.find().readPref("nearest")`,
      sqlCode: `-- PostgreSQL logical replication
-- On primary server
CREATE PUBLICATION app_publication 
FOR TABLE users, orders;

-- On replica server
CREATE SUBSCRIPTION app_subscription 
CONNECTION 'host=primary-db.example.com' 
PUBLICATION app_publication;

-- Using BDR for multi-master setup
SELECT bdr.create_node_group(
  'global_cluster',
  '{"us-east", "eu-west", "ap-southeast"}'
);

-- Conflict resolution
CREATE OR REPLACE FUNCTION 
resolve_user_conflict()
RETURNS trigger AS $$
BEGIN
  IF NEW.updated_at > OLD.updated_at THEN
    RETURN NEW;
  ELSE
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;`
    },
    {
      claimTag: "Real-World Performance",
      detailedClaim: "NoSQL databases are necessary for high-performance applications and large-scale deployments. Traditional SQL databases can't handle the load of modern web-scale applications.",
      rebuttal: "PostgreSQL powers some of the world's largest applications. Instagram uses PostgreSQL to handle 1+ billion users and 100+ million photos/videos daily. Uber's deployment handles 10+ million writes per second. Reddit, Twitch, and Apple's iCloud all rely on PostgreSQL for core functionality. Benchmarks consistently show PostgreSQL matching or outperforming MongoDB in read operations and ACID-compliant writes.",
      noSqlCode: `// MongoDB scaling claims
- "Web-scale" by default
- Eventually consistent
- Horizontal scaling for writes
- No ACID overhead
- Schema-free performance`,
      sqlCode: `-- PostgreSQL real-world stats
- Instagram: 1B+ users, 100M+ uploads/day
- Uber: 10M+ writes/second
- Reddit: Main database backend
- Twitch: Core streaming infrastructure
- Apple iCloud: User data storage

-- Performance features
- Parallel query execution
- Just-In-Time compilation
- Multi-version concurrency control
- Advanced query planning
- Intelligent buffer management`
    },
    {
      claimTag: "Enterprise Support",
      detailedClaim: "NoSQL databases offer better enterprise support and commercial backing. Organizations need professional support for mission-critical deployments.",
      rebuttal: "PostgreSQL has a robust enterprise support ecosystem. Major providers include EDB, AWS (RDS), Google Cloud (CloudSQL), Azure, Crunchy Data, and 2ndQuadrant. These offer 24/7 support, security patches, monitoring, and high availability solutions. The PostgreSQL community includes major corporations and thousands of active developers, ensuring long-term stability.",
      noSqlCode: `// MongoDB Enterprise features
- Atlas cloud platform
- Single vendor support
- Commercial licensing
- Proprietary tools
- Vendor lock-in risks`,
      sqlCode: `-- PostgreSQL Enterprise Support
- Multiple vendors (EDB, AWS, GCP, Azure)
- Open-source foundation
- No vendor lock-in
- 24/7 professional support options
- Active security maintenance
- Regular releases
- Cloud-native solutions
- Migration services
- Training and certification`
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header style={{ background: styles.headerBg }} className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Database size={48} className="text-white" />
            <h1 className="text-4xl font-bold text-white">No, SQL</h1>
          </div>
          <p className="text-xl text-white">
            Why PostgreSQL is probably the answer to your NoSQL needs
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {content.map((section, index) => {
            const sectionSlug = getSectionSlug(section.claimTag);
            return (
              <div key={index} className="mb-6" id={sectionSlug}>
                <button
                  onClick={() => handleSectionToggle(index)}
                  className="w-full bg-white rounded p-4 flex justify-between items-center hover:bg-gray-50"
                  style={{ borderLeft: styles.buttonBorderLeft }}
                >
                  <a
                    href={`#${sectionSlug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xl font-bold"
                    style={{ color: styles.primary }}
                  >
                    {section.claimTag}
                  </a>
                  {openSection === index ? (
                    <ChevronUp className="text-gray-500" />
                  ) : (
                    <ChevronDown className="text-gray-500" />
                  )}
                </button>

                {openSection === index && (
                  <div className="mt-4 bg-white rounded p-6">
                    <div className="mb-6">
                      <h3 className="text-lg font-bold mb-2" style={{ color: styles.primary }}>
                        The Claim:
                      </h3>
                      <p className="text-gray-700">{section.detailedClaim}</p>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-bold mb-2" style={{ color: styles.primary }}>
                        The Reality:
                      </h3>
                      <p className="text-gray-700">{section.rebuttal}</p>
                    </div>

                    {(section.noSqlCode || section.sqlCode) && (
                      <div className="mt-6">
                        <h3 className="text-lg font-bold mb-4" style={{ color: styles.primary }}>
                          Show me the code:
                        </h3>
                        
                        <div className="lg:grid lg:grid-cols-2 lg:gap-4">
                          {/* NoSQL Code */}
                          <div className="mb-4 lg:mb-0">
                            <div className="p-2 text-white font-bold rounded-t" 
                                 style={{ background: styles.secondary }}>
                              NoSQL Approach
                            </div>
                            <pre className="bg-gray-900 text-white p-4 rounded-b overflow-x-auto">
                              <code>{section.noSqlCode}</code>
                            </pre>
                          </div>
                          
                          {/* SQL Code */}
                          <div>
                            <div className="p-2 text-white font-bold rounded-t"
                                 style={{ background: styles.primary }}>
                              PostgreSQL Solution
                            </div>
                            <pre className="bg-gray-900 text-white p-4 rounded-b overflow-x-auto">
                              <code>{section.sqlCode}</code>
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: styles.headerBg }} className="p-6 mt-8">
        <div className="max-w-6xl mx-auto text-center text-white">
          <p>No, SQL! - Use the right tool, not the shiny one (made by <a href='https://estsauver.com'>Earl St Sauver</a>)</p>
        </div>
      </footer>
    </div>
  );
};

export default NoSQLSite;