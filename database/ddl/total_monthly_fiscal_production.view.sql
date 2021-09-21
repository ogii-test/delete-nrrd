--
-- PostgreSQL database dump
--

-- Dumped from database version 12.8 (Debian 12.8-1.pgdg100+1)
-- Dumped by pg_dump version 12.8 (Debian 12.8-1.pgdg100+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: total_monthly_fiscal_production; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.total_monthly_fiscal_production AS
 SELECT a.period,
    a.year,
    a.month,
    a.month_long,
    a.period_date,
    a.product,
    a.source,
    a.sort_order,
    sum(a.sum) AS sum
   FROM ( SELECT t1.period,
            t1.year,
            t1.month,
            t1.month_long,
            t1.period_date,
            t1.product,
            t2.source,
            t2.sort_order,
                CASE
                    WHEN (t1.source = t2.source) THEN t1.sum
                    ELSE NULL::numeric
                END AS sum
           FROM (( SELECT period.period,
                    period.fiscal_year AS year,
                    period.fiscal_month AS month,
                    period.month_long,
                    period.period_date,
                    commodity.product,
                    (location.land_type)::text AS source,
                        CASE
                            WHEN ((location.land_class)::text = 'Mixed Exploratory'::text) THEN 0
                            WHEN (((location.land_class)::text = 'Native American'::text) OR ((location.land_class)::text = 'Native American '::text)) THEN 1
                            WHEN (((location.land_class)::text = 'Federal'::text) AND ((location.land_category)::text = 'Onshore'::text)) THEN 3
                            WHEN (((location.land_class)::text = 'Federal'::text) AND ((location.land_category)::text = 'Offshore'::text)) THEN 2
                            ELSE 0
                        END AS sort_order,
                    (sum((production.volume)::double precision))::numeric(12,2) AS sum
                   FROM (((public.production
                     JOIN public.period USING (period_id))
                     JOIN public.location USING (location_id))
                     JOIN public.commodity USING (commodity_id))
                  WHERE (((period.period)::text = 'Monthly'::text) AND (period.fiscal_year <= ( SELECT max(period_1.fiscal_year) AS max
                           FROM (public.production production_1
                             JOIN public.period period_1 USING (period_id))
                          WHERE (period_1.fiscal_month = 12))) AND (period.fiscal_year >= ( SELECT max((period_1.fiscal_year - 2)) AS max
                           FROM (public.production production_1
                             JOIN public.period period_1 USING (period_id))
                          WHERE (period_1.fiscal_month = 12))))
                  GROUP BY period.period, period.fiscal_year, period.fiscal_month, period.month_long, period.period_date, commodity.product, location.land_type, location.land_category, location.land_class,
                        CASE
                            WHEN ((location.land_class)::text = 'Mixed Exploratory'::text) THEN 0
                            WHEN (((location.land_class)::text = 'Native American'::text) OR ((location.land_class)::text = 'Native American '::text)) THEN 1
                            WHEN (((location.land_class)::text = 'Federal'::text) AND ((location.land_category)::text = 'Onshore'::text)) THEN 3
                            WHEN (((location.land_class)::text = 'Federal'::text) AND ((location.land_category)::text = 'Offshore'::text)) THEN 2
                            ELSE 0
                        END
                  ORDER BY period.period, period.fiscal_year, period.fiscal_month, period.month_long, period.period_date,
                        CASE
                            WHEN ((location.land_class)::text = 'Mixed Exploratory'::text) THEN 0
                            WHEN (((location.land_class)::text = 'Native American'::text) OR ((location.land_class)::text = 'Native American '::text)) THEN 1
                            WHEN (((location.land_class)::text = 'Federal'::text) AND ((location.land_category)::text = 'Onshore'::text)) THEN 3
                            WHEN (((location.land_class)::text = 'Federal'::text) AND ((location.land_category)::text = 'Offshore'::text)) THEN 2
                            ELSE 0
                        END) t1
             LEFT JOIN ( SELECT DISTINCT period.period,
                    period.fiscal_year AS year,
                    period.fiscal_month AS month,
                    period.month_long,
                    period.period_date,
                    (location.land_type)::text AS source,
                        CASE
                            WHEN ((location.land_class)::text = 'Mixed Exploratory'::text) THEN 0
                            WHEN (((location.land_class)::text = 'Native American'::text) OR ((location.land_class)::text = 'Native American '::text)) THEN 1
                            WHEN (((location.land_class)::text = 'Federal'::text) AND ((location.land_category)::text = 'Onshore'::text)) THEN 3
                            WHEN (((location.land_class)::text = 'Federal'::text) AND ((location.land_category)::text = 'Offshore'::text)) THEN 2
                            ELSE 0
                        END AS sort_order
                   FROM (((public.production
                     JOIN public.period USING (period_id))
                     JOIN public.location USING (location_id))
                     JOIN public.commodity USING (commodity_id))
                  WHERE (((period.period)::text = 'Monthly'::text) AND (period.fiscal_year <= ( SELECT max(period_1.fiscal_year) AS max
                           FROM (public.production production_1
                             JOIN public.period period_1 USING (period_id))
                          WHERE (period_1.fiscal_month = 12))) AND (period.fiscal_year >= ( SELECT max((period_1.fiscal_year - 2)) AS max
                           FROM (public.production production_1
                             JOIN public.period period_1 USING (period_id))
                          WHERE (period_1.fiscal_month = 12))))) t2 USING (period, year, month, month_long, period_date))) a
  GROUP BY a.period, a.year, a.month, a.month_long, a.period_date, a.product, a.source, a.sort_order
  ORDER BY a.period, a.year, a.month, a.sort_order;


ALTER TABLE public.total_monthly_fiscal_production OWNER TO postgres;

--
-- PostgreSQL database dump complete
--

