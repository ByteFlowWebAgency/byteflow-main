'use client';

import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import SectionLabel from '@/components/SectionLabel/SectionLabel';
import CTABanner from '@/components/CTABanner/CTABanner';
import styles from './page.module.css';

export default function ServicesPage() {
    useScrollAnimation();

    const services = [
        {
            title: "Enterprise Software Solutions",
            subtext: "Architecting the Backbone of Your Business",
            body: "We build scalable, custom enterprise platforms that unify your operations. Our team designs resilient architectures capable of handling massive data throughput, integrating seamlessly with your legacy systems, and providing a single source of truth across your organization. By leveraging microservices and event-driven architecture, we ensure your software can adapt to rapid business growth without accumulating technical debt.",
            features: ["Microservices Architecture", "Legacy System Modernization", "High-Volume Data Processing", "API Ecosystems"]
        },
        {
            title: "Custom Software Development",
            subtext: "Bespoke Solutions for Unique Challenges",
            body: "Off-the-shelf software often forces you to compromise on your workflow. We build custom applications tailored to your exact specifications. From complex internal dashboards to customer-facing web platforms, we deliver clean, performant, and secure code. Our agile methodology ensures rapid iteration and a product that perfectly aligns with your strategic goals.",
            features: ["Full-Stack Web Development", "Progressive Web Apps", "Internal Tooling", "MVP Development"]
        },
        {
            title: "AI Integration",
            subtext: "Embedding Intelligence into Operations",
            body: "Artificial Intelligence is no longer just a buzzword; it's a competitive necessity. We integrate cutting-edge AI and Machine Learning models directly into your existing workflows. Whether it's predictive analytics for supply chain optimization, NLP for automated customer support, or custom LLM deployment, we turn data into actionable intelligence.",
            features: ["LLM Integration (GPT, Claude, etc.)", "Predictive Analytics", "Computer Vision Systems", "Process Automation"]
        },
        {
            title: "Cloud Solutions",
            subtext: "Resilient Infrastructure at Scale",
            body: "Your software is only as good as the infrastructure it runs on. We design, build, and deploy cloud environments on AWS, Azure, and GCP that prioritize high availability, robust security, and cost optimization. We treat infrastructure as code (IaC), enabling rapid deployments, automated scaling, and disaster recovery so you never have to worry about downtime.",
            features: ["Cloud Migration Strategy", "Infrastructure as Code (Terraform)", "Kubernetes Orchestration", "Serverless Architectures"]
        },
        {
            title: "Software Consulting & Host Management",
            subtext: "Strategic Advisory and Always-On Support",
            body: "Technology leadership requires both vision and execution. We act as strategic partners, providing architectural reviews, technology stack audits, and technical debt reduction strategies. Beyond consulting, our host management teams provide 24/7 monitoring, incident response, and continuous optimization to keep your systems running flawlessly.",
            features: ["Architecture Audits", "CTO Advisory Services", "24/7 Monitoring & Alerting", "Continuous Optimization"]
        }
    ];

    return (
        <>
            <section className={styles.hero}>
                <div className={styles.container}>
                    <SectionLabel label="OUR CAPABILITIES" />
                    <h1 className={styles.title} data-animate>
                        End-to-End Technology Solutions.
                    </h1>
                    <p className={styles.subtitle} data-animate>
                        We deliver comprehensive engineering across the full modern tech stack—from resilient cloud infrastructure to intelligent data systems.
                    </p>
                </div>
            </section>

            <section className={styles.servicesContainer}>
                {services.map((service, i) => (
                    <div key={i} className={`${styles.serviceRow} ${i % 2 !== 0 ? styles.reversed : ''}`} data-animate>
                        <div className={styles.container}>
                            <div className={styles.serviceContent}>
                                <div className={styles.textContent}>
                                    <div className={styles.number}>0{i + 1}</div>
                                    <h2 className={styles.serviceTitle}>{service.title}</h2>
                                    <h3 className={styles.serviceSubtext}>{service.subtext}</h3>
                                    <p className={styles.serviceBody}>{service.body}</p>

                                    <ul className={styles.featureList}>
                                        {service.features.map((feature, j) => (
                                            <li key={j} className={styles.featureItem}>
                                                <span className={styles.check}>✓</span> {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className={styles.visualPlaceholder}>
                                    <div className={styles.visualGraphic}>
                                        <div className={styles.graphicLine}></div>
                                        <div className={styles.graphicCircle}></div>
                                        <div className={styles.graphicLine}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            <CTABanner
                heading="Ready to Optimize Your Systems?"
                subtext="Contact our engineering team to discuss your architecture and see how we can help you scale."
                buttonLabel="Request a Consultation"
                buttonHref="/contact"
            />
        </>
    );
}
